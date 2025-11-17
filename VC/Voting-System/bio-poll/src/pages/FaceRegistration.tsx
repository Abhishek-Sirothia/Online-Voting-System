import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, CheckCircle, Loader2 } from "lucide-react";

// Helper to convert Data URL to a file object
const dataURLtoFile = (dataurl: string, filename: string) => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
}

const FaceRegistration = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string>("");
  const [videoReady, setVideoReady] = useState(false);

  // This effect only checks if the user is logged in. It no longer redirects.
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  // Attach stream to video element
  useEffect(() => {
    if (!videoRef.current || !stream) return;
    const video = videoRef.current;
    video.srcObject = stream;
    const handleLoadedMetadata = () => {
      video.play().catch(console.error);
      setVideoReady(true);
    };
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
    } catch (error) {
      console.error(error);
      toast.error("Failed to access camera. Please allow camera permissions.");
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setImageData(dataUrl);
    setCaptured(true);
  };

  const retake = () => {
    setCaptured(false);
    setImageData("");
  };

  const registerFace = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const file = dataURLtoFile(imageData, `${session.user.id}.jpg`);
      const filePath = `${session.user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Set to false to prevent overwriting existing files if not intended
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          face_registered: true,
          avatar_url: publicUrl,
        })
        .eq("id", session.user.id);
      if (profileError) throw profileError;
      
      await supabase.from("face_data").upsert({
        user_id: session.user.id,
        face_encoding: "placeholder_for_face_encoding",
      }, { onConflict: 'user_id' });

      toast.success("Face registered successfully!");

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-success/10 p-3 rounded-full">
              <Camera className="h-10 w-10 text-success" />
            </div>
          </div>
          <CardTitle className="text-2xl">Face Registration</CardTitle>
          <CardDescription>
            Register your face for secure verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="mb-2">📸 <strong>Important:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Ensure good lighting</li>
              <li>Look directly at the camera</li>
              <li>Remove glasses if possible</li>
              <li>Keep a neutral expression</li>
            </ul>
          </div>

          <div className="relative w-full h-[480px] bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${captured ? "hidden" : ""}`}
            />
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-cover absolute inset-0 ${captured ? "" : "hidden"}`}
            />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button onClick={startCamera} size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {stream && !captured && (
              <Button
                onClick={captureImage}
                className="flex-1"
                size="lg"
                disabled={!videoReady}
              >
                <Camera className="mr-2 h-5 w-5" />
                Capture Photo
              </Button>
            )}
            {captured && (
              <>
                <Button onClick={retake} variant="outline" className="flex-1" size="lg">
                  Retake
                </Button>
                <Button onClick={registerFace} disabled={loading} className="flex-1" size="lg">
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-5 w-5" />
                  )}
                  Register Face
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FaceRegistration;