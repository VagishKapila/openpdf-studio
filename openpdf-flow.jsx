import { useState } from "react";
import { ChevronRight, ChevronLeft, Upload, FileText, Send, PenTool, CreditCard, CheckCircle, Bell, ArrowRight, Shield, Eye, Clock, DollarSign, Users, Mail, MessageSquare, Zap, Lock, Download, AlertCircle, Star, LayoutDashboard } from "lucide-react";

const STEPS = [
  { id: "overview", label: "Flow Overview" },
  { id: "upload", label: "1. Customer Uploads" },
  { id: "configure", label: "2. Configure & Send" },
  { id: "email", label: "3. Client Gets Email" },
  { id: "editor", label: "4. Client Signs (Editor)" },
  { id: "payment", label: "5. Payment Collection" },
  { id: "complete", label: "6. Dashboard Updates" },
  { id: "notifications", label: "7. Notifications" },
];

function FlowOverview() {
  const steps = [
    { icon: <Upload size={24} />, title: "Customer Uploads", desc: "Uploads PDF on OpenPDF Studio dashboard", color: "#6366f1", who: "Customer" },
    { icon: <FileText size={24} />, title: "Configure Fields", desc: "Places signature fields, sets payment", color: "#8b5cf6", who: "Customer" },
    { icon: <Send size={24} />, title: "Send to Client", desc: "Client gets email with secure link", color: "#0ea5e9", who: "System" },
    { icon: <PenTool size={24} />, title: "Client Signs", desc: "Opens editor, signs all fields", color: "#14b8a6", who: "Client" },
    { icon: <CreditCard size={24} />, title: "Payment", desc: "Stripe checkout after signing", color: "#f59e0b", who: "Client" },
    { icon: <CheckCircle size={24} />, title: "Complete", desc: "Dashboard updates, doc stored", color: "#059669", who: "System" },
  ];

  return (
    <div style={{ padding: "40px 32px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>OpenPDF Studio — Complete Product Flow</h2>
        <p style={{ fontSize: 15, color: "#666", marginTop: 8, maxWidth: 600, margin: "8px auto 0" }}>
          How a document goes from your customer's dashboard to their client's signature to payment — all in one product.
        </p>
      </div>

      {/* Flow diagram */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 8, flexWrap: "wrap", maxWidth: 1100, margin: "0 auto" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 160, padding: "20px 16px", background: "#fff",
              border: `2px solid ${step.color}20`, borderRadius: 16,
              textAlign: "center", position: "relative",
              boxShadow: `0 4px 24px ${step.color}15`
            }}>
              <div style={{
                position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                background: step.who === "Customer" ? "#6366f1" : step.who === "Client" ? "#14b8a6" : "#f59e0b",
                color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 10px",
                borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em"
              }}>{step.who}</div>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: "8px auto 12px",
                background: `${step.color}12`, color: step.color,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{step.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 650, color: "#1a1a2e", marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{step.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 40 }}>
        {[
          { color: "#6366f1", label: "Customer (your user)" },
          { color: "#14b8a6", label: "Client (end signer)" },
          { color: "#f59e0b", label: "System (automated)" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: l.color }} />
            <span style={{ fontSize: 12, color: "#666" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div style={{
        maxWidth: 700, margin: "40px auto 0", padding: "20px 24px",
        background: "linear-gradient(135deg, #6366f110, #8b5cf610)",
        borderRadius: 12, border: "1px solid #6366f120"
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", marginBottom: 6 }}>Key Architecture Decision</div>
        <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
          The <strong>Customer</strong> works in the OpenPDF Studio React dashboard (upload, configure, track).
          The <strong>Client</strong> opens a secure link that loads the PDF Editor module — they never see the dashboard.
          Everything connects through the backend API and database.
        </div>
      </div>
    </div>
  );
}

function StepUpload() {
  return (
    <div style={{ padding: "32px" }}>
      <StepHeader number={1} title="Customer Uploads Document" who="Customer on Dashboard" color="#6366f1" />

      {/* Mock dashboard UI */}
      <div style={{
        maxWidth: 900, margin: "24px auto 0", background: "#fff",
        borderRadius: 16, border: "2px solid #e8e8f0",
        boxShadow: "0 4px 24px rgba(99,102,241,0.08)", overflow: "hidden"
      }}>
        {/* Dashboard header */}
        <div style={{
          padding: "12px 24px", background: "#fafafe",
          borderBottom: "1px solid #e8e8f0", display: "flex",
          alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>DF</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>OpenPDF Studio</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>VK</div>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {/* Sidebar */}
          <div style={{ width: 200, borderRight: "1px solid #e8e8f0", padding: "16px 0", background: "#fafafe" }}>
            {["Overview", "Documents", "Revenue", "Audit Log", "Settings"].map((item, i) => (
              <div key={i} style={{
                padding: "8px 20px", fontSize: 13, color: i === 1 ? "#6366f1" : "#666",
                fontWeight: i === 1 ? 600 : 400,
                background: i === 1 ? "#6366f108" : "transparent",
                borderLeft: i === 1 ? "3px solid #6366f1" : "3px solid transparent",
                cursor: "pointer"
              }}>{item}</div>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: "24px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Documents</h3>
              <button style={{
                padding: "10px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)"
              }}>
                <Upload size={16} /> New Document
              </button>
            </div>

            {/* Upload modal overlay */}
            <div style={{
              background: "#fff", border: "2px dashed #6366f140",
              borderRadius: 16, padding: "40px 32px", textAlign: "center"
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, margin: "0 auto 16px",
                background: "#6366f108", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Upload size={28} color="#6366f1" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a2e", marginBottom: 4 }}>
                Drop your document here
              </div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
                PDF, Word, or image files up to 50MB
              </div>
              <button style={{
                padding: "10px 28px", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>Browse Files</button>
            </div>
          </div>
        </div>
      </div>

      <Callout color="#6366f1" title="What happens here">
        Customer clicks "New Document" on their OpenPDF Studio dashboard. They upload a PDF (or Word doc that gets auto-converted).
        The file goes to S3, a record is created in the documents table, and they move to the configuration step.
      </Callout>
    </div>
  );
}

function StepConfigure() {
  const [paymentEnabled, setPaymentEnabled] = useState(true);

  return (
    <div style={{ padding: "32px" }}>
      <StepHeader number={2} title="Configure Fields & Send" who="Customer on Dashboard" color="#8b5cf6" />

      {/* Mock configuration UI */}
      <div style={{
        maxWidth: 900, margin: "24px auto 0", background: "#fff",
        borderRadius: 16, border: "2px solid #e8e8f0",
        boxShadow: "0 4px 24px rgba(99,102,241,0.08)", overflow: "hidden"
      }}>
        {/* Top bar */}
        <div style={{
          padding: "12px 24px", background: "#fafafe",
          borderBottom: "1px solid #e8e8f0", display: "flex",
          alignItems: "center", gap: 12
        }}>
          <ChevronLeft size={16} color="#888" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>Configure: Contract_Agreement.pdf</span>
          <div style={{ flex: 1 }} />
          {/* Progress */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {["Upload", "Configure", "Send"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11, fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: i <= 1 ? "#6366f1" : "#e8e8f0",
                  color: i <= 1 ? "#fff" : "#888"
                }}>{i + 1}</div>
                <span style={{ fontSize: 11, color: i <= 1 ? "#6366f1" : "#888", fontWeight: i === 1 ? 600 : 400 }}>{s}</span>
                {i < 2 && <div style={{ width: 20, height: 1, background: "#e8e8f0" }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {/* PDF preview */}
          <div style={{ width: "50%", padding: 24, borderRight: "1px solid #e8e8f0", background: "#f8f8f6" }}>
            <div style={{
              background: "#fff", borderRadius: 8, padding: 32,
              minHeight: 360, border: "1px solid #eee", position: "relative"
            }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 16 }}>Contract_Agreement.pdf — Page 1 of 3</div>
              {/* Fake doc content */}
              <div style={{ fontSize: 12, color: "#444", lineHeight: 1.8 }}>
                <div style={{ height: 8, background: "#e8e8f0", borderRadius: 4, width: "80%", marginBottom: 10 }} />
                <div style={{ height: 8, background: "#e8e8f0", borderRadius: 4, width: "100%", marginBottom: 10 }} />
                <div style={{ height: 8, background: "#e8e8f0", borderRadius: 4, width: "65%", marginBottom: 24 }} />
                <div style={{ height: 8, background: "#e8e8f0", borderRadius: 4, width: "90%", marginBottom: 10 }} />
                <div style={{ height: 8, background: "#e8e8f0", borderRadius: 4, width: "75%", marginBottom: 24 }} />
              </div>
              {/* Placed signature fields */}
              <div style={{
                position: "absolute", bottom: 80, left: 40,
                border: "2px dashed #6366f1", borderRadius: 6,
                padding: "6px 12px", background: "#6366f108", fontSize: 10, color: "#6366f1", fontWeight: 600
              }}>
                <PenTool size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Signature Field
              </div>
              <div style={{
                position: "absolute", bottom: 80, right: 40,
                border: "2px dashed #f59e0b", borderRadius: 6,
                padding: "6px 12px", background: "#f59e0b08", fontSize: 10, color: "#f59e0b", fontWeight: 600
              }}>
                <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Date Field
              </div>
              <div style={{
                position: "absolute", bottom: 40, left: 40,
                border: "2px dashed #0ea5e9", borderRadius: 6,
                padding: "6px 12px", background: "#0ea5e908", fontSize: 10, color: "#0ea5e9", fontWeight: 600
              }}>
                <FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Name Field
              </div>
            </div>
          </div>

          {/* Configuration panel */}
          <div style={{ width: "50%", padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 650, color: "#1a1a2e", marginBottom: 16 }}>Recipient</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Name</label>
                <input style={{
                  width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8f0",
                  borderRadius: 8, fontSize: 13, marginTop: 4, outline: "none", boxSizing: "border-box"
                }} placeholder="John Smith" defaultValue="John Smith" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Email</label>
                <input style={{
                  width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8f0",
                  borderRadius: 8, fontSize: 13, marginTop: 4, outline: "none", boxSizing: "border-box"
                }} placeholder="john@company.com" defaultValue="john@company.com" />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 650, color: "#1a1a2e", marginBottom: 12 }}>Signature Fields</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { type: "Signature", page: 1, icon: <PenTool size={14} />, color: "#6366f1" },
                  { type: "Date", page: 1, icon: <Clock size={14} />, color: "#f59e0b" },
                  { type: "Full Name", page: 1, icon: <FileText size={14} />, color: "#0ea5e9" },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", background: `${f.color}06`, borderRadius: 8,
                    border: `1px solid ${f.color}20`
                  }}>
                    <div style={{ color: f.color }}>{f.icon}</div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e", flex: 1 }}>{f.type}</span>
                    <span style={{ fontSize: 11, color: "#888" }}>Page {f.page}</span>
                  </div>
                ))}
              </div>
              <button style={{
                marginTop: 8, padding: "6px 12px", background: "none",
                border: "1px dashed #6366f140", borderRadius: 8, fontSize: 12,
                color: "#6366f1", cursor: "pointer", width: "100%"
              }}>+ Add Field</button>
            </div>

            {/* Payment section */}
            <div style={{
              padding: 16, background: paymentEnabled ? "#f59e0b08" : "#fafafe",
              borderRadius: 12, border: paymentEnabled ? "1.5px solid #f59e0b30" : "1.5px solid #e8e8f0"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: paymentEnabled ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard size={16} color={paymentEnabled ? "#f59e0b" : "#888"} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Require Payment</span>
                </div>
                <div onClick={() => setPaymentEnabled(!paymentEnabled)} style={{
                  width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                  background: paymentEnabled ? "#f59e0b" : "#ddd",
                  padding: 2, transition: "0.15s ease"
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 9, background: "#fff",
                    transform: paymentEnabled ? "translateX(18px)" : "translateX(0)",
                    transition: "0.15s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                  }} />
                </div>
              </div>
              {paymentEnabled && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>Amount</label>
                    <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 14, color: "#888", marginRight: 4 }}>$</span>
                      <input style={{
                        width: "100%", padding: "6px 8px", border: "1.5px solid #e8e8f0",
                        borderRadius: 6, fontSize: 13, outline: "none"
                      }} defaultValue="250.00" />
                    </div>
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>Description</label>
                    <input style={{
                      width: "100%", padding: "6px 8px", border: "1.5px solid #e8e8f0",
                      borderRadius: 6, fontSize: 13, marginTop: 4, outline: "none", boxSizing: "border-box"
                    }} defaultValue="Contract signing fee" />
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Message to Client</label>
              <textarea style={{
                width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8f0",
                borderRadius: 8, fontSize: 13, marginTop: 4, resize: "vertical",
                minHeight: 60, outline: "none", boxSizing: "border-box"
              }} defaultValue="Hi John, please review and sign this contract at your earliest convenience." />
            </div>

            {/* Deadline */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Signing Deadline</label>
              <input type="date" style={{
                width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8f0",
                borderRadius: 8, fontSize: 13, marginTop: 4, outline: "none", boxSizing: "border-box"
              }} defaultValue="2026-04-15" />
            </div>

            <button style={{
              width: "100%", marginTop: 20, padding: "12px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
              fontWeight: 600, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)"
            }}>
              <Send size={16} /> Send to Client
            </button>
          </div>
        </div>
      </div>

      <Callout color="#8b5cf6" title="Questions we ask the customer">
        <strong>Who's signing?</strong> Name + email of the client.{" "}
        <strong>What fields?</strong> Drag signature, date, name, initials fields onto the PDF.{" "}
        <strong>Payment?</strong> Toggle on, set amount + description.{" "}
        <strong>Deadline?</strong> Optional signing deadline.{" "}
        <strong>Message?</strong> Custom note included in the email.
      </Callout>
    </div>
  );
}

function StepEmail() {
  return (
    <div style={{ padding: "32px" }}>
      <StepHeader number={3} title="Client Receives Email" who="System → Client" color="#0ea5e9" />

      <div style={{
        maxWidth: 520, margin: "24px auto 0", background: "#fff",
        borderRadius: 16, border: "2px solid #e8e8f0",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden"
      }}>
        {/* Email header */}
        <div style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          padding: "32px 32px 24px", textAlign: "center"
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)",
            margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <FileText size={24} color="#fff" />
          </div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Document Ready to Sign</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>from Vagish Kapila via OpenPDF Studio</div>
        </div>

        {/* Email body */}
        <div style={{ padding: "28px 32px" }}>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.7, margin: "0 0 16px" }}>
            Hi John,
          </p>
          <p style={{ fontSize: 14, color: "#333", lineHeight: 1.7, margin: "0 0 16px" }}>
            Vagish Kapila has sent you a document to review and sign:
          </p>

          {/* Doc card */}
          <div style={{
            padding: "16px 20px", background: "#fafafe", borderRadius: 10,
            border: "1px solid #e8e8f0", marginBottom: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "#6366f110", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={18} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>Contract_Agreement.pdf</div>
                <div style={{ fontSize: 12, color: "#888" }}>3 pages · 3 fields to complete · Payment: $250.00</div>
              </div>
            </div>
          </div>

          <div style={{
            padding: "12px 16px", background: "#f59e0b08", borderRadius: 8,
            border: "1px solid #f59e0b20", marginBottom: 16, display: "flex",
            alignItems: "center", gap: 8
          }}>
            <Clock size={14} color="#f59e0b" />
            <span style={{ fontSize: 12, color: "#b45309" }}>Please sign by April 15, 2026</span>
          </div>

          <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: "0 0 20px", fontStyle: "italic" }}>
            "Hi John, please review and sign this contract at your earliest convenience."
          </p>

          <a href="#" onClick={e => e.preventDefault()} style={{
            display: "block", width: "100%", padding: "14px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
            fontWeight: 600, cursor: "pointer", textAlign: "center",
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)"
          }}>
            Review & Sign Document
          </a>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
            <Shield size={12} color="#059669" />
            <span style={{ fontSize: 11, color: "#888" }}>Secured with 256-bit encryption</span>
          </div>
        </div>

        {/* Email footer */}
        <div style={{ padding: "16px 32px", background: "#fafafe", borderTop: "1px solid #e8e8f0", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#aaa" }}>Sent via OpenPDF Studio · Secure document signing</div>
        </div>
      </div>

      <Callout color="#0ea5e9" title="What the system does">
        Backend creates a <strong>signature_request</strong> record with a unique <strong>access token</strong>.
        Resend sends a branded email from noreply@varshyl.com. The "Review & Sign" button links to:{" "}
        <code style={{ fontSize: 11, background: "#f5f5f5", padding: "2px 6px", borderRadius: 4 }}>
          app.openpdfstudio.com/sign/{'<accessToken>'}
        </code>
        — no login required for the client.
      </Callout>
    </div>
  );
}

function StepEditor() {
  return (
    <div style={{ padding: "32px" }}>
      <StepHeader number={4} title="Client Signs in the Editor" who="Client (no login needed)" color="#14b8a6" />

      {/* Mock editor UI */}
      <div style={{
        maxWidth: 960, margin: "24px auto 0", background: "#fff",
        borderRadius: 16, border: "2px solid #e8e8f0",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden"
      }}>
        {/* Editor top bar */}
        <div style={{
          padding: "10px 20px", background: "#1a1a2e",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>DF</span>
            </div>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>OpenPDF Studio — Sign Document</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Progress */}
            {["Review", "Sign", "Complete"].map((s, i) => (
              <div key={i} style={{
                padding: "4px 12px", borderRadius: 6, fontSize: 11,
                background: i === 1 ? "#6366f1" : "rgba(255,255,255,0.1)",
                color: i <= 1 ? "#fff" : "#888", fontWeight: i === 1 ? 600 : 400
              }}>{s}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {/* Document area */}
          <div style={{ flex: 1, padding: 24, background: "#f0f0ee" }}>
            <div style={{
              background: "#fff", borderRadius: 4, padding: "32px 40px",
              minHeight: 400, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              position: "relative"
            }}>
              {/* Fake doc */}
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>Service Agreement</div>
              {[80, 100, 65, 90, 75, 100, 85, 60].map((w, i) => (
                <div key={i} style={{ height: 7, background: "#e8e8f0", borderRadius: 3, width: `${w}%`, marginBottom: 8 }} />
              ))}
              <div style={{ height: 24 }} />
              {[95, 70, 88, 100, 50].map((w, i) => (
                <div key={i} style={{ height: 7, background: "#e8e8f0", borderRadius: 3, width: `${w}%`, marginBottom: 8 }} />
              ))}

              {/* Active signature field */}
              <div style={{
                position: "absolute", bottom: 100, left: 40, right: 40,
                border: "2px solid #6366f1", borderRadius: 8,
                background: "#6366f108", padding: 12
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#6366f1", marginBottom: 8 }}>SIGNATURE — Click to sign</div>
                <div style={{
                  height: 50, background: "#fff", borderRadius: 6, border: "1px dashed #ccc",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 28, color: "#1a1a2e" }}>John Smith</span>
                </div>
              </div>

              {/* Date field */}
              <div style={{
                position: "absolute", bottom: 50, right: 40,
                border: "2px solid #059669", borderRadius: 8,
                background: "#05966908", padding: "8px 16px"
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#059669" }}>DATE</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e" }}>03/31/2026</div>
              </div>
            </div>
          </div>

          {/* Right panel — signing wizard */}
          <div style={{ width: 280, borderLeft: "1px solid #e8e8f0", padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 650, color: "#1a1a2e", marginBottom: 16 }}>Sign Document</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle size={14} /> 2 of 3 fields completed
              </div>
              <div style={{ height: 6, background: "#e8e8f0", borderRadius: 3 }}>
                <div style={{ height: 6, background: "#059669", borderRadius: 3, width: "66%" }} />
              </div>
            </div>

            {/* Fields list */}
            {[
              { label: "Full Name", value: "John Smith", done: true },
              { label: "Signature", value: "Signed", done: true },
              { label: "Date", value: "Auto-filled", done: false, active: true },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", marginBottom: 6, borderRadius: 8,
                background: f.active ? "#6366f108" : f.done ? "#05966908" : "#fafafe",
                border: f.active ? "1.5px solid #6366f130" : "1.5px solid transparent"
              }}>
                {f.done ? (
                  <CheckCircle size={16} color="#059669" />
                ) : (
                  <div style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid #6366f1" }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a2e" }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{f.value}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 24, padding: "12px 16px", background: "#f59e0b08", borderRadius: 10, border: "1px solid #f59e0b20" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CreditCard size={14} color="#f59e0b" />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>Payment Required</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>$250.00</div>
              <div style={{ fontSize: 11, color: "#888" }}>Contract signing fee</div>
            </div>

            <button style={{
              width: "100%", marginTop: 16, padding: "12px",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
              fontWeight: 600, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(5,150,105,0.3)"
            }}>
              <CheckCircle size={16} /> Finalize & Pay
            </button>
          </div>
        </div>
      </div>

      <Callout color="#14b8a6" title="This is the PDF Editor module">
        The client opens a <strong>secure token-based URL</strong> — no account needed. They see the document with
        pre-placed fields highlighted. They sign (draw or type), fill in name/date (auto-filled where possible),
        review all fields, then hit "Finalize & Pay." This is the open-source editor module doing the heavy lifting —
        PDF.js renders, Fabric.js handles annotations, pdf-lib flattens the signatures into the final PDF.
      </Callout>
    </div>
  );
}

function StepPayment() {
  return (
    <div style={{ padding: "32px" }}>
      <StepHeader number={5} title="Payment Collection" who="Client → Stripe → OpenPDF Studio" color="#f59e0b" />

      <div style={{ display: "flex", gap: 24, maxWidth: 900, margin: "24px auto 0", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Stripe checkout mock */}
        <div style={{
          width: 380, background: "#fff", borderRadius: 16,
          border: "2px solid #e8e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden"
        }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>DF</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>OpenPDF Studio</span>
            </div>
            <div style={{ fontSize: 13, color: "#888" }}>Contract signing fee</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#1a1a2e", marginTop: 4 }}>$250.00</div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pay with card</div>
            <div style={{ padding: "10px 12px", border: "1.5px solid #e8e8f0", borderRadius: 8, marginBottom: 10, fontSize: 13, color: "#666" }}>
              john@company.com
            </div>
            <div style={{ padding: "10px 12px", border: "1.5px solid #e8e8f0", borderRadius: 8, marginBottom: 10, fontSize: 13, color: "#aaa" }}>
              1234 1234 1234 1234
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #e8e8f0", borderRadius: 8, fontSize: 13, color: "#aaa" }}>MM / YY</div>
              <div style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #e8e8f0", borderRadius: 8, fontSize: 13, color: "#aaa" }}>CVC</div>
            </div>
            <button style={{
              width: "100%", padding: "12px", background: "#6366f1",
              color: "#fff", border: "none", borderRadius: 8, fontSize: 14,
              fontWeight: 600, cursor: "pointer"
            }}>Pay $250.00</button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
              <Lock size={11} color="#888" />
              <span style={{ fontSize: 11, color: "#888" }}>Powered by Stripe</span>
            </div>
          </div>
        </div>

        {/* Flow explanation */}
        <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: <CheckCircle size={18} />, title: "Signing Complete", desc: "PDF flattened with embedded signatures. Stored in S3.", color: "#059669", step: "1" },
            { icon: <ArrowRight size={18} />, title: "Redirect to Stripe", desc: "Backend creates a Stripe Checkout Session with the amount set by the customer.", color: "#6366f1", step: "2" },
            { icon: <CreditCard size={18} />, title: "Client Pays", desc: "Standard Stripe hosted checkout. Card, Apple Pay, Google Pay.", color: "#f59e0b", step: "3" },
            { icon: <Zap size={18} />, title: "Webhook Fires", desc: "Stripe webhook hits /payments/webhook. Payment record created. Document status → 'paid'.", color: "#8b5cf6", step: "4" },
            { icon: <Download size={18} />, title: "Client Gets Signed PDF", desc: "Redirected to success page with download link for their signed copy.", color: "#14b8a6", step: "5" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "12px 16px",
              background: "#fff", borderRadius: 10,
              border: "1.5px solid #e8e8f0"
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${item.color}10`, color: item.color,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Callout color="#f59e0b" title="Payment architecture">
        The customer <strong>never touches Stripe directly</strong>. They just toggle "Require Payment" and set the amount.
        The backend creates the Stripe Checkout Session when the client finalizes signing. Stripe handles PCI compliance.
        The webhook updates the payment record and document status automatically.
      </Callout>
    </div>
  );
}

function StepComplete() {
  return (
    <div style={{ padding: "32px" }}>
      <StepHeader number={6} title="Dashboard Updates Live" who="Customer sees results" color="#059669" />

      {/* Mock dashboard showing completed doc */}
      <div style={{
        maxWidth: 900, margin: "24px auto 0", background: "#fff",
        borderRadius: 16, border: "2px solid #e8e8f0",
        boxShadow: "0 4px 24px rgba(99,102,241,0.08)", overflow: "hidden"
      }}>
        <div style={{ padding: "12px 24px", background: "#fafafe", borderBottom: "1px solid #e8e8f0", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>DF</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>OpenPDF Studio Dashboard</span>
        </div>

        {/* KPI row */}
        <div style={{ display: "flex", gap: 16, padding: "20px 24px", borderBottom: "1px solid #e8e8f0" }}>
          {[
            { label: "Docs Sent", value: "24", trend: "+3 this week", color: "#6366f1" },
            { label: "Signed", value: "18", trend: "75% rate", color: "#059669" },
            { label: "Revenue", value: "$4,250", trend: "+$250 today", color: "#f59e0b" },
            { label: "Pending", value: "6", trend: "2 overdue", color: "#dc2626" },
          ].map((kpi, i) => (
            <div key={i} style={{
              flex: 1, padding: "16px", background: "#fafafe", borderRadius: 12,
              border: "1.5px solid #e8e8f0"
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: "4px 0" }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: kpi.color, fontWeight: 500 }}>{kpi.trend}</div>
            </div>
          ))}
        </div>

        {/* Document list with status */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 650, color: "#1a1a2e", marginBottom: 12 }}>Recent Documents</div>

          {/* Table header */}
          <div style={{ display: "flex", padding: "8px 12px", borderBottom: "1px solid #e8e8f0" }}>
            <div style={{ flex: 3, fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Document</div>
            <div style={{ flex: 2, fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recipient</div>
            <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
            <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Payment</div>
          </div>

          {/* Highlighted row — just completed */}
          <div style={{
            display: "flex", padding: "12px", alignItems: "center",
            background: "#05966906", borderRadius: 8, marginTop: 4,
            border: "1px solid #05966920"
          }}>
            <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={16} color="#6366f1" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Contract_Agreement.pdf</div>
                <div style={{ fontSize: 11, color: "#888" }}>Signed 2 minutes ago</div>
              </div>
            </div>
            <div style={{ flex: 2, fontSize: 13, color: "#555" }}>John Smith</div>
            <div style={{ flex: 1 }}>
              <span style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: "#05966915", color: "#059669", border: "1px solid #05966930"
              }}>Completed</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: "#05966915", color: "#059669", border: "1px solid #05966930"
              }}>$250 Paid</span>
            </div>
          </div>

          {/* Other rows */}
          {[
            { name: "NDA_2026.pdf", recipient: "Sarah Connor", status: "Viewed", statusColor: "#0ea5e9", payment: "Pending", paymentColor: "#f59e0b" },
            { name: "Invoice_March.pdf", recipient: "Mike Chen", status: "Sent", statusColor: "#8b5cf6", payment: "$150 Paid", paymentColor: "#059669" },
            { name: "Lease_Agreement.pdf", recipient: "Lisa Park", status: "Overdue", statusColor: "#dc2626", payment: "N/A", paymentColor: "#888" },
          ].map((doc, i) => (
            <div key={i} style={{ display: "flex", padding: "12px", alignItems: "center", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
                <FileText size={16} color="#888" />
                <span style={{ fontSize: 13, color: "#555" }}>{doc.name}</span>
              </div>
              <div style={{ flex: 2, fontSize: 13, color: "#555" }}>{doc.recipient}</div>
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: `${doc.statusColor}10`, color: doc.statusColor,
                  border: `1px solid ${doc.statusColor}25`
                }}>{doc.status}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: `${doc.paymentColor}10`, color: doc.paymentColor,
                  border: `1px solid ${doc.paymentColor}25`
                }}>{doc.payment}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Callout color="#059669" title="What the customer sees">
        Their dashboard updates <strong>in real-time</strong>. Document status moves from Sent → Viewed → Signed → Paid → Completed.
        Revenue KPI updates. They can download the signed PDF, see the audit trail, and track all their documents in one place.
        No need to check email or Stripe separately.
      </Callout>
    </div>
  );
}

function StepNotifications() {
  return (
    <div style={{ padding: "32px" }}>
      <StepHeader number={7} title="Notifications & Follow-ups" who="System (automated)" color="#8b5cf6" />

      <div style={{ display: "flex", gap: 24, maxWidth: 900, margin: "24px auto 0", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Notification inbox mock */}
        <div style={{
          width: 380, background: "#fff", borderRadius: 16,
          border: "2px solid #e8e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #e8e8f0",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ fontSize: 14, fontWeight: 650, color: "#1a1a2e" }}>Notifications</div>
            <span style={{
              padding: "2px 8px", borderRadius: 10, fontSize: 11,
              background: "#dc262615", color: "#dc2626", fontWeight: 600
            }}>3 new</span>
          </div>

          {[
            {
              icon: <CheckCircle size={16} />, color: "#059669", time: "2 min ago",
              title: "Document signed & paid",
              desc: "John Smith signed Contract_Agreement.pdf and paid $250.00"
            },
            {
              icon: <Eye size={16} />, color: "#0ea5e9", time: "1 hour ago",
              title: "Document viewed",
              desc: "Sarah Connor opened NDA_2026.pdf"
            },
            {
              icon: <AlertCircle size={16} />, color: "#dc2626", time: "3 hours ago",
              title: "Signing overdue",
              desc: "Lisa Park has not signed Lease_Agreement.pdf (deadline was yesterday)"
            },
            {
              icon: <CreditCard size={16} />, color: "#f59e0b", time: "Yesterday",
              title: "Payment received",
              desc: "Mike Chen paid $150.00 for Invoice_March.pdf"
            },
            {
              icon: <Mail size={16} />, color: "#8b5cf6", time: "Yesterday",
              title: "Reminder sent",
              desc: "Auto-reminder sent to Lisa Park for Lease_Agreement.pdf"
            },
          ].map((n, i) => (
            <div key={i} style={{
              padding: "14px 20px", borderBottom: "1px solid #f5f5f5",
              background: i < 3 ? `${n.color}04` : "transparent"
            }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${n.color}10`, color: n.color,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{n.icon}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{n.title}</span>
                    <span style={{ fontSize: 10, color: "#aaa" }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{n.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Automated actions */}
        <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 650, color: "#1a1a2e", marginBottom: 4 }}>Automated Actions</div>

          {[
            { icon: <Mail size={18} />, title: "Email Notifications", desc: "Customer gets emailed when documents are viewed, signed, and paid. Configurable per document.", color: "#6366f1" },
            { icon: <Bell size={18} />, title: "Smart Reminders", desc: "Auto-sends signing reminders to clients. Escalation: 1 day, 3 days, 7 days before deadline.", color: "#f59e0b" },
            { icon: <LayoutDashboard size={18} />, title: "Dashboard Sync", desc: "All status changes reflect instantly on the customer's dashboard. No manual refreshing.", color: "#059669" },
            { icon: <Shield size={18} />, title: "Audit Trail", desc: "Every action logged: who viewed, signed, paid, when, from what IP. Legally admissible.", color: "#8b5cf6" },
            { icon: <Zap size={18} />, title: "Webhook Events", desc: "Stripe webhooks update payment status. Document webhooks available for customer integrations.", color: "#14b8a6" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "14px 16px",
              background: "#fff", borderRadius: 10,
              border: "1.5px solid #e8e8f0"
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: `${item.color}10`, color: item.color,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Callout color="#8b5cf6" title="The full loop">
        This is where OpenPDF Studio becomes a <strong>complete business tool</strong> — not just "sign a PDF."
        The customer uploads → client signs & pays → customer gets notified → revenue tracked → audit logged →
        reminders automated. One product, end to end.
      </Callout>
    </div>
  );
}

function StepHeader({ number, title, who, color }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "4px 16px 4px 4px", background: `${color}10`,
        borderRadius: 20, border: `1px solid ${color}25`, marginBottom: 8
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 12, background: color,
          color: "#fff", fontSize: 12, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{number}</div>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{who}</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>{title}</h2>
    </div>
  );
}

function Callout({ color, title, children }) {
  return (
    <div style={{
      maxWidth: 900, margin: "24px auto 0", padding: "16px 20px",
      background: `${color}06`, borderRadius: 12,
      border: `1px solid ${color}20`
    }}>
      <div style={{ fontSize: 12, fontWeight: 650, color, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export default function OpenPDF StudioFlow() {
  const [currentStep, setCurrentStep] = useState(0);

  const pages = [
    <FlowOverview />,
    <StepUpload />,
    <StepConfigure />,
    <StepEmail />,
    <StepEditor />,
    <StepPayment />,
    <StepComplete />,
    <StepNotifications />,
  ];

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      background: "#fafafe", minHeight: "100vh",
      color: "#1a1a2e"
    }}>
      {/* Top navigation */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,250,254,0.95)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e8e8f0", padding: "0 24px"
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 56
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>DF</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>OpenPDF Studio Product Flow</span>
          </div>

          <div style={{ display: "flex", gap: 2 }}>
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                style={{
                  padding: "6px 12px", border: "none", borderRadius: 8,
                  fontSize: 11, fontWeight: currentStep === i ? 600 : 400,
                  background: currentStep === i ? "#6366f1" : "transparent",
                  color: currentStep === i ? "#fff" : "#888",
                  cursor: "pointer", transition: "0.15s ease",
                  whiteSpace: "nowrap"
                }}
              >{step.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {pages[currentStep]}
      </div>

      {/* Bottom navigation */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "rgba(250,250,254,0.95)", backdropFilter: "blur(8px)",
        borderTop: "1px solid #e8e8f0", padding: "12px 24px"
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            style={{
              padding: "8px 20px", border: "1.5px solid #e8e8f0", borderRadius: 10,
              background: "#fff", fontSize: 13, fontWeight: 500,
              color: currentStep === 0 ? "#ccc" : "#555",
              cursor: currentStep === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <div style={{ fontSize: 12, color: "#888" }}>
            {currentStep + 1} of {STEPS.length}
          </div>

          <button
            onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
            disabled={currentStep === STEPS.length - 1}
            style={{
              padding: "8px 20px", border: "none", borderRadius: 10,
              background: currentStep === STEPS.length - 1 ? "#e8e8f0" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              fontSize: 13, fontWeight: 600,
              color: currentStep === STEPS.length - 1 ? "#888" : "#fff",
              cursor: currentStep === STEPS.length - 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: currentStep === STEPS.length - 1 ? "none" : "0 4px 16px rgba(99,102,241,0.3)"
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}