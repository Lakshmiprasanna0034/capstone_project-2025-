import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Review = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentData, filePath } = location.state || {};

  const [formData, setFormData] = useState({
    name: documentData?.extractedData?.name || "",
    idNumber: documentData?.extractedData?.idNumber || "",
    dob: documentData?.extractedData?.dob || "",
    address: documentData?.extractedData?.address || "",
  });

  if (!documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No document data found</p>
          <Button onClick={() => navigate("/upload")}>Upload Document</Button>
        </Card>
      </div>
    );
  }

  const handleContinue = () => {
    navigate("/liveness", { 
      state: { 
        documentData: { ...documentData, extractedData: formData },
        filePath 
      } 
    });
  };

  const confidence = documentData.confidence || 85;
  const docType = documentData.documentType || "Unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/upload")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Review Extracted Data</h1>
          <p className="text-muted-foreground mb-6">
            Verify the information extracted from your document
          </p>

          {/* Document Info */}
          <div className="mb-8 p-4 rounded-lg bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Document Type:</span>
              <Badge variant="outline" className="text-sm">
                {docType}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">OCR Confidence:</span>
                <span className={confidence >= 80 ? "text-success" : "text-warning"}>
                  {confidence}%
                </span>
              </div>
              <Progress value={confidence} className="h-2" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {confidence >= 80 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-success">High confidence extraction</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-warning">Please review carefully</span>
                </>
              )}
            </div>
          </div>

          {/* Document Photo */}
          {documentData.photoUrl && (
            <div className="mb-8">
              <Label className="mb-2 block">Document Photo</Label>
              <div className="w-40 h-40 rounded-lg border-2 border-border overflow-hidden bg-secondary">
                <img 
                  src={documentData.photoUrl} 
                  alt="Document photo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Extracted Fields */}
          <div className="space-y-4 mb-8">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="Enter ID number"
              />
            </div>

            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/upload")}>
              Cancel
            </Button>
            <Button onClick={handleContinue} size="lg" className="px-8">
              Continue to Liveness Check
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Review;
