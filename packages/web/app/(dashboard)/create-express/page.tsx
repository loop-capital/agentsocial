"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Wand2,
  LayoutTemplate,
  Pencil,
  Eye,
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Calendar,
  Clock,
  X,
  Sparkles,
} from "lucide-react";
import GenerateImageButton from "@/components/adobe-express/GenerateImageButton";
import TemplateBrowserButton from "@/components/adobe-express/TemplateBrowserButton";
import ImageEditorButton from "@/components/adobe-express/ImageEditorButton";
import DesignViewer from "@/components/adobe-express/DesignViewer";
import { useCCEverywhere } from "@/components/adobe-express/CCEverywhereProvider";

type Step = "template" | "edit" | "preview" | "schedule";

const STEPS: { id: Step; label: string }[] = [
  { id: "template", label: "Template" },
  { id: "edit", label: "Edit" },
  { id: "preview", label: "Preview" },
  { id: "schedule", label: "Schedule" },
];

export default function CreateExpressPage() {
  const { isReady, isLoading, error } = useCCEverywhere();
  const [currentStep, setCurrentStep] = useState<Step>("template");
  const [generatedImage, setGeneratedImage] = useState<ArrayBuffer | undefined>(undefined);
  const [editedImage, setEditedImage] = useState<ArrayBuffer | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [postCaption, setPostCaption] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const activeImage = editedImage || generatedImage;
  const activeImageUrl = imageUrl || (activeImage ? URL.createObjectURL(new Blob([activeImage])) : "");

  const handleGenerated = useCallback((asset: ArrayBuffer | undefined) => {
    setGeneratedImage(asset);
    if (asset) {
      const url = URL.createObjectURL(new Blob([asset]));
      setImageUrl(url);
      setCurrentStep("edit");
    }
  }, []);

  const handleEdited = useCallback((asset: ArrayBuffer | undefined) => {
    setEditedImage(asset);
    if (asset) {
      const url = URL.createObjectURL(new Blob([asset]));
      setImageUrl(url);
      setCurrentStep("preview");
    }
  }, []);

  const handleTemplateSelected = useCallback(() => {
    setCurrentStep("edit");
  }, []);

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const handleSchedule = () => {
    setShowSuccessModal(true);
  };

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  if (isLoading) {
    return (
      <div className="page-content">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: "1rem" }}>
          <div style={{ width: 32, height: 32, border: "2px solid var(--color-primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading Adobe Express SDK...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: "1rem", maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-danger-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={24} style={{ color: "var(--color-danger)" }} />
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Adobe Express SDK Error</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{error.message}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Make sure NEXT_PUBLIC_ADOBE_CLIENT_ID and NEXT_PUBLIC_ADOBE_APP_NAME are set in .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link
              href="/create"
              style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <ArrowLeft size={14} />
              Back to Create
            </Link>
          </div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={20} style={{ color: "var(--color-primary)" }} />
            Create with Adobe Express
          </h1>
          <p>Design, edit, and schedule posts using Adobe Express</p>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {STEPS.map((step, idx) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => goToStep(step.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: idx <= stepIndex ? "pointer" : "not-allowed",
                  background: idx <= stepIndex ? "var(--color-primary)" : "var(--bg-hover)",
                  color: idx <= stepIndex ? "white" : "var(--text-muted)",
                  opacity: idx > stepIndex ? 0.6 : 1,
                }}
                disabled={idx > stepIndex}
              >
                {idx < stepIndex ? (
                  <Check size={14} />
                ) : (
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem" }}>
                    {idx + 1}
                  </span>
                )}
                {step.label}
              </button>
              {idx < STEPS.length - 1 && (
                <ArrowRight size={14} style={{ color: idx < stepIndex ? "var(--color-primary)" : "var(--text-muted)" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Main Editor Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* STEP 1: Template */}
          {currentStep === "template" && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <LayoutTemplate size={16} />
                  Choose a Starting Point
                </h2>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "1.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                      <LayoutTemplate size={24} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <h3 style={{ fontWeight: 500 }}>Browse Templates</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      Start from thousands of Adobe Express templates
                    </p>
                    <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                      <TemplateBrowserButton onTemplateSelected={handleTemplateSelected} />
                    </div>
                  </div>

                  <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "1.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                      <Wand2 size={24} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <h3 style={{ fontWeight: 500 }}>Generate with AI</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      Create an image from a text prompt
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="e.g., sunset beach social media post"
                        className="form-input"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                      />
                      <GenerateImageButton
                        prompt={imagePrompt}
                        onGenerated={handleGenerated}
                      />
                    </div>
                  </div>
                </div>

                {activeImageUrl && (
                  <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "1rem" }}>
                    <h3 style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.75rem" }}>Selected Asset</h3>
                    <img
                      src={activeImageUrl}
                      alt="Selected"
                      style={{ maxHeight: 256, borderRadius: "var(--radius-lg)", objectFit: "contain", background: "var(--bg-subtle)", display: "block" }}
                    />
                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                      <button className="btn btn-primary" onClick={() => setCurrentStep("edit")}>
                        Continue to Edit
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Edit */}
          {currentStep === "edit" && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Pencil size={16} />
                  Edit Design
                </h2>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {activeImageUrl ? (
                  <>
                    <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "1rem" }}>
                      <img
                        src={activeImageUrl}
                        alt="Editing"
                        style={{ maxHeight: 256, borderRadius: "var(--radius-lg)", objectFit: "contain", background: "var(--bg-subtle)", display: "block", margin: "0 auto" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
                      <ImageEditorButton
                        imageAsset={activeImageUrl}
                        onEdited={handleEdited}
                      />
                      <GenerateImageButton
                        prompt={imagePrompt}
                        onGenerated={handleGenerated}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <button className="btn btn-secondary" onClick={() => setCurrentStep("template")}>
                        <ArrowLeft size={14} />
                        Back
                      </button>
                      <button className="btn btn-primary" onClick={() => setCurrentStep("preview")} disabled={!activeImageUrl}>
                        Continue to Preview
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "3rem 0" }}>
                    <ImageIcon size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
                    <p style={{ color: "var(--text-muted)" }}>No image selected. Go back to choose a template or generate an image.</p>
                    <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setCurrentStep("template")}>
                      <ArrowLeft size={14} />
                      Back to Templates
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {currentStep === "preview" && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Eye size={16} />
                  Preview
                </h2>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {activeImageUrl ? (
                  <>
                    <div style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: "1.5rem", background: "var(--bg-subtle)" }}>
                      <div style={{ maxWidth: 400, margin: "0 auto" }}>
                        <div style={{ background: "white", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                          <img
                            src={activeImageUrl}
                            alt="Preview"
                            style={{ width: "100%", objectFit: "cover" }}
                          />
                          <div style={{ padding: "1rem" }}>
                            <p style={{ fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>{postCaption || "Your caption will appear here..."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
                      <DesignViewer imageAsset={activeImageUrl} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <label className="form-label">Post Caption</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Write your caption..."
                        value={postCaption}
                        onChange={(e) => setPostCaption(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <button className="btn btn-secondary" onClick={() => setCurrentStep("edit")}>
                        <ArrowLeft size={14} />
                        Back
                      </button>
                      <button className="btn btn-primary" onClick={() => setCurrentStep("schedule")}>
                        Continue to Schedule
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "3rem 0" }}>
                    <ImageIcon size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
                    <p style={{ color: "var(--text-muted)" }}>No image to preview. Go back to create one.</p>
                    <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setCurrentStep("template")}>
                      <ArrowLeft size={14} />
                      Back to Templates
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Schedule */}
          {currentStep === "schedule" && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={16} />
                  Schedule Post
                </h2>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {activeImageUrl && (
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <img
                      src={activeImageUrl}
                      alt="Post"
                      style={{ width: 96, height: 96, borderRadius: "var(--radius-lg)", objectFit: "cover", background: "var(--bg-subtle)", flexShrink: 0 }}
                    />
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Post Preview</p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {postCaption || "No caption"}
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Calendar size={14} />
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={14} />
                      Time
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-secondary" onClick={() => setCurrentStep("preview")}>
                    <ArrowLeft size={14} />
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSchedule}
                    disabled={!scheduleDate || !scheduleTime || !activeImageUrl}
                  >
                    <Check size={14} />
                    Schedule Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Asset Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 500 }}>Asset Status</h3>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: generatedImage || imageUrl ? "var(--color-success)" : "var(--text-muted)" }} />
                <span style={{ color: generatedImage || imageUrl ? "var(--color-primary)" : "var(--text-muted)" }}>
                  {generatedImage || imageUrl ? "Asset selected" : "No asset"}
                </span>
              </div>
              {editedImage && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)" }} />
                  <span style={{ color: "var(--color-primary)" }}>Edited</span>
                </div>
              )}
              {activeImageUrl && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img
                    src={activeImageUrl}
                    alt="Current asset"
                    style={{ width: "100%", height: 128, objectFit: "cover", borderRadius: "var(--radius-lg)", background: "var(--bg-subtle)" }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 500 }}>Quick Tips</h3>
            </div>
            <div className="card-body" style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p>• Use AI generation for unique imagery</p>
              <p>• Browse templates for quick starts</p>
              <p>• Edit directly in Adobe Express</p>
              <p>• Preview before scheduling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 600 }}>
                <Check size={18} style={{ color: "var(--color-success)" }} />
                Post Scheduled!
              </h2>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Your post has been scheduled for {scheduleDate} at {scheduleTime}.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
              <Link href="/calendar" className="btn btn-primary">
                View Calendar
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
