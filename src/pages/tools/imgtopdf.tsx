import Navbar from "@/components/Navbar";
import Head from "next/head";

export default function ImgToPdf() {
  return (
    <>
      <Head>
        <title>ToolHub Image to PDF</title>
        <meta
          name="description"
          content="Convert images to PDF files, entirely in your browser."
        />
      </Head>
      <main>
        <Navbar isSubPage title="Image to PDF" />
        <div className="workInProgress">
          <h2>Work in Progress</h2>
          <p>
            This tool is currently under development. Please check back later!
          </p>
        </div>
      </main>
    </>
  );
}
