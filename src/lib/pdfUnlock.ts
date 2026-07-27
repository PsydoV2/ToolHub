import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFString,
  PDFHexString,
  PDFRawStream,
  PDFRef,
  PDFNumber,
  PDFBool,
  PDFObject,
} from "pdf-lib";
import {
  computeFileKeyR234,
  validatePasswordR234,
  decryptDataR234,
  computeFileKeyR6,
  decryptDataR6,
} from "./pdfCrypto";

export type UnlockResult =
  | { status: "not-protected" }
  | { status: "unsupported"; reason: string }
  | { status: "wrong-password" }
  | { status: "success"; bytes: Uint8Array };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Removes password/permission protection from a PDF that uses the Standard
 * security handler with a classic (non-compressed) cross-reference table —
 * revisions 2-4 (RC4, AES-128) and 6 (AES-256). PDFs that require decrypting
 * compressed object streams to even parse their structure aren't supported
 * (reported as "unsupported" rather than silently producing a broken file). */
export async function unlockPdf(
  fileBytes: Uint8Array,
  password: string
): Promise<UnlockResult> {
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(fileBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
  } catch {
    return {
      status: "unsupported",
      reason:
        "This file couldn't be parsed. It may be corrupted, or use a PDF structure (e.g. compressed cross-reference streams) this tool doesn't support yet.",
    };
  }

  if (!pdfDoc.isEncrypted) {
    return { status: "not-protected" };
  }

  const context = pdfDoc.context;
  const encryptRef = context.trailerInfo.Encrypt;
  const encDict = context.lookup(encryptRef, PDFDict);

  const R = encDict.lookup(PDFName.of("R"), PDFNumber).asNumber();
  if (R !== 2 && R !== 3 && R !== 4 && R !== 6) {
    return {
      status: "unsupported",
      reason: `Encryption revision R${R} isn't supported yet — only R2-R4 (RC4/AES-128) and R6 (AES-256) are.`,
    };
  }

  let ID0: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  if (context.trailerInfo.ID) {
    const idArray = context.lookup(context.trailerInfo.ID, PDFArray);
    ID0 = idArray.lookup(0, PDFString, PDFHexString).asBytes();
  }

  const passwordBytes = new TextEncoder().encode(password);
  let fileKey: Uint8Array;
  let isAES = false;
  const isR6 = R === 6;

  if (isR6) {
    const U = encDict.lookup(PDFName.of("U"), PDFString, PDFHexString).asBytes();
    const UE = encDict
      .lookup(PDFName.of("UE"), PDFString, PDFHexString)
      .asBytes();
    const result = await computeFileKeyR6(passwordBytes, U, UE);
    if (!result.passwordMatches) return { status: "wrong-password" };
    fileKey = result.fileKey;
    isAES = true;
  } else {
    const V = encDict.lookupMaybe(PDFName.of("V"), PDFNumber)?.asNumber() ?? 0;
    const O = encDict.lookup(PDFName.of("O"), PDFString, PDFHexString).asBytes();
    const U = encDict.lookup(PDFName.of("U"), PDFString, PDFHexString).asBytes();
    const P = encDict.lookup(PDFName.of("P"), PDFNumber).asNumber();
    const lengthBits =
      encDict.lookupMaybe(PDFName.of("Length"), PDFNumber)?.asNumber() ?? 40;
    const encryptMetadata =
      encDict.lookupMaybe(PDFName.of("EncryptMetadata"), PDFBool)?.asBoolean() ??
      true;

    if (V === 4) {
      const CF = encDict.lookup(PDFName.of("CF"), PDFDict);
      const StdCF = CF.lookup(PDFName.of("StdCF"), PDFDict);
      const CFM = StdCF.lookup(PDFName.of("CFM"), PDFName).asString();
      isAES = CFM === "/AESV2";
    }

    fileKey = computeFileKeyR234({
      password: passwordBytes,
      O,
      P,
      ID0,
      R,
      keyLengthBytes: lengthBits / 8,
      encryptMetadata,
    });
    if (!validatePasswordR234(fileKey, R, ID0, U)) {
      return { status: "wrong-password" };
    }
  }

  const decrypt = (data: Uint8Array, ref: PDFRef): Uint8Array =>
    isR6
      ? decryptDataR6(data, fileKey)
      : decryptDataR234(data, fileKey, ref.objectNumber, ref.generationNumber, isAES);

  const encryptRefObjNum =
    encryptRef instanceof PDFRef ? encryptRef.objectNumber : undefined;

  const patchDict = (dict: PDFDict, ref: PDFRef) => {
    for (const [key, val] of dict.entries()) {
      if (val instanceof PDFString || val instanceof PDFHexString) {
        dict.set(key, PDFHexString.of(bytesToHex(decrypt(val.asBytes(), ref))));
      } else if (val instanceof PDFArray) {
        patchArray(val, ref);
      } else if (val instanceof PDFDict) {
        patchDict(val, ref);
      }
    }
  };
  const patchArray = (arr: PDFArray, ref: PDFRef) => {
    for (let i = 0; i < arr.size(); i++) {
      const val = arr.get(i);
      if (val instanceof PDFString || val instanceof PDFHexString) {
        arr.set(i, PDFHexString.of(bytesToHex(decrypt(val.asBytes(), ref))));
      } else if (val instanceof PDFArray) {
        patchArray(val, ref);
      } else if (val instanceof PDFDict) {
        patchDict(val, ref);
      }
    }
  };

  try {
    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      if (ref.objectNumber === encryptRefObjNum) continue;
      if (obj instanceof PDFRawStream) {
        const dec = decrypt(obj.contents, ref);
        context.assign(ref, PDFRawStream.of(obj.dict, dec));
        patchDict(obj.dict, ref);
      } else if (obj instanceof PDFDict) {
        patchDict(obj, ref);
      } else if (obj instanceof PDFArray) {
        patchArray(obj, ref);
      }
    }
  } catch {
    return {
      status: "unsupported",
      reason:
        "Failed to decrypt this PDF's contents. It may use a structure this tool doesn't support yet.",
    };
  }

  context.trailerInfo.Encrypt = undefined as unknown as PDFObject;
  const outBytes = await pdfDoc.save();
  return { status: "success", bytes: outBytes };
}
