import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Verification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verificationResult } = location.state || {};

  if (!verificationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No verification result found</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const { verified, scores, token, timestamp } = verificationResult;

  const downloadToken = () => {
    const blob = new Blob([JSON.stringify({ token, timestamp, verified }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verification-token-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="p-8 shadow-lg">
          <div className="text-center mb-8">
            <div
              className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                verified
                  ? "bg-success/10 shadow-glow"
                  : "bg-destructive/10"
              }`}
            >
              {verified ? (
                <CheckCircle className="w-12 h-12 text-success" />
              ) : (
                <XCircle className="w-12 h-12 text-destructive" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {verified ? "Verification Successful" : "Verification Failed"}
            </h1>
            <p className="text-muted-foreground">
              {verified
                ? "Your identity has been successfully verified"
                : "Unable to verify identity. Please try again."}
            </p>
          </div>

          {/* Verification Scores */}
          <div className="space-y-6 mb-8">
            <h3 className="font-semibold text-lg">Verification Scores</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span>OCR Confidence</span>
                  <Badge variant={scores.ocrConfidence >= 80 ? "default" : "secondary"}>
                    {scores.ocrConfidence}%
                  </Badge>
                </div>
                <Progress value={scores.ocrConfidence} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span>Document Validation</span>
                  <Badge variant={scores.documentValidation >= 80 ? "default" : "secondary"}>
                    {scores.documentValidation}%
                  </Badge>
                </div>
                <Progress value={scores.documentValidation} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span>Liveness Detection</span>
                  <Badge variant={scores.livenessScore >= 80 ? "default" : "secondary"}>
                    {scores.livenessScore}%
                  </Badge>
                </div>
                <Progress value={scores.livenessScore} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span>Face Match</span>
                  <Badge variant={scores.faceMatchScore >= 80 ? "default" : "secondary"}>
                    {scores.faceMatchScore}%
                  </Badge>
                </div>
                <Progress value={scores.faceMatchScore} className="h-2" />
              </div>
            </div>
          </div>

          {/* Token Info */}
          {verified && token && (
            <div className="mb-8 p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold mb-2">Verification Token</h3>
              <p className="text-xs font-mono text-muted-foreground break-all mb-3">
                {token.substring(0, 60)}...
              </p>
              <Button variant="outline" size="sm" onClick={downloadToken}>
                <Download className="w-4 h-4 mr-2" />
                Download Token
              </Button>
            </div>
          )}

          {/* Timestamp */}
          <div className="mb-8 text-sm text-muted-foreground text-center">
            Verified at: {new Date(timestamp).toLocaleString()}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            {!verified && (
              <Button onClick={() => navigate("/upload")} variant="outline">
                Try Again
              </Button>
            )}
            <Button onClick={() => navigate("/")} size="lg">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Verification;
