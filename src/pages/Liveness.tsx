import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Liveness = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { documentData, filePath } = location.state || {};
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    console.log('Starting camera...');
    setVideoReady(false);
    
    try {
      const constraints = {
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      console.log('Requesting camera with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', mediaStream.active);
      console.log('Video tracks:', mediaStream.getVideoTracks().length);
      
      setStream(mediaStream);
      setIsCapturing(true);
      
      // Wait a moment for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting srcObject on video element');
          videoRef.current.srcObject = mediaStream;
          
          // Handle when video metadata is loaded
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('Video playing successfully');
                  setVideoReady(true);
                })
                .catch(err => {
                  console.error('Play error:', err);
                  // Try again after a short delay
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                    setVideoReady(true);
                  }, 300);
                });
            }
          };
        }
      }, 100);
    } catch (error: any) {
      console.error('Camera error:', error);
      toast({
        title: "Camera access denied",
        description: error.message || "Please allow camera access to continue",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    console.log('Capturing photo...');
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    console.log('Video dimensions:', video.videoWidth, video.videoHeight);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Video not ready",
        description: "Please wait for the camera to fully load",
        variant: "destructive",
      });
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Flip horizontally to match the mirrored video display
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL("image/jpeg", 0.95);
      console.log('Image captured, size:', imageData.length);
      setCapturedImage(imageData);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsCapturing(false);
      setVideoReady(false);
    }
  };

  const handleVerify = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      // Call verification edge function
      const { data, error } = await supabase.functions.invoke("verify-document", {
        body: {
          documentData,
          filePath,
          livePhoto: capturedImage,
        },
      });

      if (error) throw error;

      toast({
        title: "Verification complete",
        description: "Processing results...",
      });

      navigate("/verification", { state: { verificationResult: data } });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No document data found</p>
          <Button onClick={() => navigate("/upload")}>Start Over</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/review", { state: { documentData, filePath } })}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Liveness Detection</h1>
          <p className="text-muted-foreground mb-8">
            Take a live photo to verify your identity
          </p>

          <div className="mb-8">
            {!isCapturing && !capturedImage && (
              <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/50">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to start camera and capture your live photo
                  </p>
                  <Button onClick={startCamera}>
                    Start Camera
                  </Button>
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                  {!videoReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-center">
                        <Camera className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                        <p>Loading camera...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 border-4 border-transparent rounded-lg pointer-events-none" 
                       style={{ 
                         boxShadow: 'inset 0 0 0 2px rgba(59, 130, 246, 0.5)',
                         borderRadius: '0.5rem'
                       }} 
                  />
                </div>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => {
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                    }
                    setIsCapturing(false);
                    setVideoReady(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={capturePhoto} disabled={!videoReady}>
                    Capture Photo
                  </Button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden border-2 border-success">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Photo captured successfully</span>
                </div>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => {
                    setCapturedImage(null);
                    startCamera();
                  }}>
                    Retake
                  </Button>
                  <Button onClick={handleVerify} disabled={isProcessing} size="lg" className="px-8">
                    {isProcessing ? "Verifying..." : "Verify Identity"}
                  </Button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground">
              <strong>Tips:</strong> Look directly at the camera, ensure good lighting, 
              and keep your face centered in the frame.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Liveness;
