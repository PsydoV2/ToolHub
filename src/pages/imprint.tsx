import Navbar from "@/components/Navbar";
import Head from "next/head";

export default function Imprint() {
  return (
    <>
      <Head>
        <title>ToolHub Imprint</title>
        <meta name="description" content="Imprint / legal notice for ToolHub." />
      </Head>
      <main>
        <Navbar isSubPage title="Imprint" />
        <div className="legalPage">
          <h2>Imprint</h2>
          <p>
            ToolHub is an independent, non-commercial collection of small
            browser-based utilities.
          </p>
          <p>
            For questions, feedback or legal inquiries regarding this site,
            please reach out via the contact details provided by the site
            operator.
          </p>
        </div>
      </main>
    </>
  );
}
