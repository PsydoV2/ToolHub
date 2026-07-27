import Navbar from "@/components/Navbar";
import Head from "next/head";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>ToolHub Privacy</title>
        <meta
          name="description"
          content="Privacy policy for ToolHub — all tools run locally in your browser."
        />
      </Head>
      <main>
        <Navbar isSubPage title="Privacy" />
        <div className="legalPage">
          <h2>Privacy Policy</h2>
          <p>
            All tools on ToolHub run entirely client-side, in your browser.
            Files, text and passwords you process with these tools are never
            uploaded to a server and never leave your device.
          </p>
          <p>
            ToolHub itself does not use cookies and does not collect personal
            data. If this site is hosted behind a third-party provider (e.g.
            for static hosting), that provider may collect basic technical
            data such as access logs, independent of ToolHub.
          </p>
        </div>
      </main>
    </>
  );
}
