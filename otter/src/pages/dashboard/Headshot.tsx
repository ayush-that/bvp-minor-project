import { useState, useRef } from "react";
import { Upload, Download, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateProfessionalHeadshot } from "@/services/geminiService";

export function Headshot() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // hdl file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // validate file size (max 10mb)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError("");
    setGeneratedImage("");

    // create preview url
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // hdl generate btn
  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setError("");

    try {
      const result = await generateProfessionalHeadshot(selectedFile);
      setGeneratedImage(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate headshot"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // hdl download
  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `professional-headshot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // hdl reset
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setGeneratedImage("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8">
      {/* hdr */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Professional Headshot Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Upload your photo and transform it into a professional LinkedIn
          headshot using AI
        </p>
      </div>

      {/* upload section */}
      {!selectedFile && (
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="rounded-full bg-primary/10 p-6">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Upload Your Photo</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Choose a clear photo of your face. Best results with good
                lighting and a neutral background.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2">
              <Upload className="h-5 w-5" />
              Choose Photo
            </Button>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WebP • Max 10MB
            </p>
          </div>
        </Card>
      )}

      {/* err msg */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/50 p-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* preview & result */}
      {selectedFile && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* original preview */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Original Photo
              </h3>
            </div>
            <div className="p-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* generated result */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Professional Headshot
              </h3>
            </div>
            <div className="p-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Generating your professional headshot...
                    </p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Professional headshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Your professional headshot will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* action btns */}
      {selectedFile && (
        <div className="flex flex-wrap gap-4 justify-center">
          {!generatedImage && !isGenerating && (
            <Button
              size="lg"
              onClick={handleGenerate}
              className="gap-2 min-w-[200px]">
              <Camera className="h-5 w-5" />
              Generate Headshot
            </Button>
          )}

          {generatedImage && (
            <>
              <Button
                size="lg"
                onClick={handleDownload}
                className="gap-2 min-w-[200px]">
                <Download className="h-5 w-5" />
                Download Headshot
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                className="gap-2">
                <Upload className="h-5 w-5" />
                Upload New Photo
              </Button>
            </>
          )}

          {!generatedImage && !isGenerating && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              className="gap-2">
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* tips section */}
      <Card className="bg-muted/50">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Tips for Best Results</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Use a photo with good lighting and clear visibility of your face
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Face the camera directly for best results</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Avoid heavy filters or editing on the original photo</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Higher resolution photos (at least 500x500px) work best
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                The AI will enhance your photo while keeping your natural
                features
              </span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
