import { Card, CardContent } from "@/components/ui/card";
import { QrCode, HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";

export default function Support() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(21);
  const [currentQR, setCurrentQR] = useState<string>("");
  const amounts = [21, 37, 58, 99];

  // Generate QR code based on selected amount.
  useEffect(() => {
    const generateQR = async () => {
      let upiLink: string;
      if (selectedAmount == 21) upiLink = `https://rzp.io/rzp/GjzIoq3c`;
      else if (selectedAmount == 37) upiLink = "https://rzp.io/rzp/XN43Y8SV";
      else if (selectedAmount == 58) upiLink = "https://rzp.io/rzp/XxBYSrMu";
      else if (selectedAmount == 99) upiLink = "https://rzp.io/rzp/tYWPjhk";
      else upiLink = "https://razorpay.me/@aahanagarwal";

      // ensure full URL (defensive)
      if (!/^https?:\/\//i.test(upiLink)) upiLink = `https://${upiLink}`;

      const qrCode = await QRCode.toDataURL(upiLink);
      setCurrentQR(qrCode);
    };

    generateQR();
  }, [selectedAmount]);

  const openUpi = () => {
    let link: string;
    if (selectedAmount == 21) link = `https://rzp.io/rzp/GjzIoq3c`;
    else if (selectedAmount == 37) link = "https://rzp.io/rzp/XN43Y8SV";
    else if (selectedAmount == 58) link = "https://rzp.io/rzp/XxBYSrMu";
    else if (selectedAmount == 99) link = "https://rzp.io/rzp/tYWPjhk";
    else link = "https://razorpay.me/@aahanagarwal";

    // defensive ensure protocol
    if (!/^https?:\/\//i.test(link)) link = `https://${link}`;

    console.log("Donate: opening link", link);

    try {
      window.open(link, "_blank");
    } catch (e) {
      window.location.href = link;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Pathfinder | Support</title>
        <meta
          name="description"
          content="Support Pathfinder and help us continue providing valuable resources for internships and career growth. Your contributions make a difference."
        />
        <link rel="canonical" href={`${window.location.origin}/support`} />
        <meta property="og:title" content="Pathfinder | Support" />
        <meta
          property="og:description"
          content="Support Pathfinder and help us continue providing valuable resources for internships and career growth."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/support`} />
        <meta
          property="og:image"
          content={`${window.location.origin}/ottericon.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pathfinder | Support" />
        <meta
          name="twitter:description"
          content="Support Pathfinder and help us continue providing valuable resources for internships and career growth."
        />
        <meta
          name="twitter:image"
          content={`${window.location.origin}/ottericon.png`}
        />
      </Helmet>

      <div className="w-full">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          {/* <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HeartHandshake className="h-7 w-7 text-primary" /> Support Pathfinder
            </h1>
            <p className="text-muted-foreground mt-1">
              Your support helps keep Pathfinder free and growing for students.
            </p>
          </div> */}

          <PageHeader
            icon={HeartHandshake}
            title="Support"
            description="Your support helps keep Pathfinder free and growing for students"
          />

          {/* Split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left: QR and amount panel */}
            <Card className="rounded-none w-full transition-shadow border border-foreground/10">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <QrCode className="h-7 w-7 text-primary mr-2" />
                    <h2 className="text-xl font-semibold text-foreground">
                      Donate via UPI
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan the QR or tap it to open a UPI app
                  </p>
                </div>

                <div className="relative">
                  {currentQR ? (
                    <a
                      href={(function () {
                        if (selectedAmount == 21) return `https://rzp.io/rzp/GjzIoq3c`;
                        if (selectedAmount == 37) return `https://rzp.io/rzp/XN43Y8SV`;
                        if (selectedAmount == 58) return `https://rzp.io/rzp/XxBYSrMu`;
                        if (selectedAmount == 99) return `https://rzp.io/rzp/tYWPjhk`;
                        return `https://razorpay.me/@aahanagarwal`;
                      })()}
                      target="_blank"
                      rel="noreferrer">
                      <img
                        src={currentQR}
                        alt={`UPI QR Code for ${
                          selectedAmount ? `₹${selectedAmount}` : "any amount"
                        } donation`}
                        className="w-56 h-56 lg:w-64 lg:h-64 object-contain rounded-md border bg-background hover:bg-foreground/5 transition-colors cursor-pointer"
                      />
                    </a>
                  ) : (
                    <div className="w-56 h-56 lg:w-64 lg:h-64 bg-foreground/5 rounded-md border flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-muted-foreground animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedAmount ? `₹${selectedAmount}` : "Any Amount"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <span
                      className="text-primary cursor-pointer hover:underline"
                      onClick={openUpi}>
                      Click QR code
                    </span>{" "}
                    or scan with any UPI app
                  </p>
                </div>

                <div className="space-y-3 w-full">
                  <h4 className="text-sm font-medium text-foreground text-center">
                    Select Amount
                  </h4>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => setSelectedAmount(null)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedAmount === null
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/10 text-foreground hover:bg-primary/10 hover:text-primary"
                      }`}>
                      Any
                    </button>
                    {amounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedAmount === amount
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/10 text-foreground hover:bg-primary/10 hover:text-primary"
                        }`}>
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                <a
                  className="text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg cursor-pointer"
                  href="https://razorpay.me/@aahanagarwal"
                  target="_blank">
                  razorpay.me/@aahanagarwal
                </a>
              </CardContent>
            </Card>

            {/* Right: Info / Impact */}
            <div className="w-full">
              <Card className="rounded-none border border-foreground/10">
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-xl font-semibold">
                    Where your support goes
                  </h2>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Server and database costs to keep Pathfinder fast</li>
                    <li>
                      New features: better search, email tooling, and more
                    </li>
                    <li>Student outreach and community support</li>
                  </ul>

                  <h3 className="text-base font-medium mt-4">
                    Other ways to help
                  </h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Share Pathfinder with friends and classmates</li>
                    <li>Send feedback and feature requests</li>
                    <li>Star our repo and follow updates</li>
                  </ul>

                  <div className="text-sm text-muted-foreground">
                    Thanks for supporting student careers. Every bit helps. 🚀
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
