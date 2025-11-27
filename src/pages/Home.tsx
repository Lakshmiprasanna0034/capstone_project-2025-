import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, FileCheck, Camera, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 shadow-glow">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Automatic Document Verification
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Secure, instant verification with advanced OCR, document validation, and liveness detection. 
            Verify identity documents with confidence.
          </p>
          <Button 
            onClick={() => navigate("/upload")}
            size="lg"
            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
          >
            Start Verification
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <FileCheck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">OCR Extraction</h3>
            <p className="text-muted-foreground">
              Advanced optical character recognition extracts all document fields with high accuracy and confidence scoring.
            </p>
          </Card>

          <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Liveness Detection</h3>
            <p className="text-muted-foreground">
              Real-time facial liveness verification ensures the person is present and not using a photo or video.
            </p>
          </Card>

          <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure Verification</h3>
            <p className="text-muted-foreground">
              Face matching, document validation, and encrypted audit logs ensure maximum security and compliance.
            </p>
          </Card>
        </div>
      </section>

      {/* Process Flow */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Verification Process</h2>
          <div className="space-y-6">
            {[
              { step: 1, title: "Upload Document", desc: "Upload an Aadhaar, passport, or driver's license" },
              { step: 2, title: "Review & Confirm", desc: "Verify extracted information and document photo" },
              { step: 3, title: "Liveness Check", desc: "Complete facial liveness detection via camera" },
              { step: 4, title: "Verification Result", desc: "Receive instant verification with signed token" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
