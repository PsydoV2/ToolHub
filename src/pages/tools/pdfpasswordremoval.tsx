import Navbar from "@/components/Navbar";
import Head from "next/head";

export default function PdfPasswordRemoval() {
  return (
    <>
      <Head>
        <title>ToolHub PDF Password removal</title>
        <meta name="description" content="Remove password from PDF files." />
      </Head>
      <main>
        <Navbar isSubPage title="PDF Password removal" />
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
