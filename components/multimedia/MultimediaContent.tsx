"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MultimediaContent() {
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [expandedSkinTypes, setExpandedSkinTypes] = useState<string[]>([]);

  const toggleCard = (cancerType: string) => {
    setExpandedCards(current =>
      current.includes(cancerType)
        ? current.filter(type => type !== cancerType)
        : [...current, cancerType]
    );
  };

  const toggleSkinType = (skinType: string) => {
    setExpandedSkinTypes(current =>
      current.includes(skinType)
        ? current.filter(type => type !== skinType)
        : [...current, skinType]
    );
  };

  const skinCancerInfo = [
    {
      type: "Melanoma",
      description: "The most dangerous form of skin cancer, developing from melanocytes.",
      symptoms: [
        "Asymmetrical moles",
        "Border irregularity",
        "Color variations within the same mole",
        "Diameter larger than 6mm",
        "Evolving size, shape, or color"
      ],
      imageUrl: "/melanoma.jpg",
      warningSign: "If you notice any of the ABCDE signs in a mole, consult a dermatologist immediately."
    },
    {
      type: "Basal Cell Carcinoma",
      description: "The most common type of skin cancer, developing in the basal cells.",
      symptoms: [
        "Pearly, waxy bump",
        "Flat, flesh-colored or brown scar-like lesion",
        "Bleeding or scabbing sore that heals and returns"
      ],
      imageUrl: "/basal-cell-carcinoma-types.png",
      warningSign: "Most common in sun-exposed areas like face and neck."
    },
    {
      type: "Squamous Cell Carcinoma",
      description: "The second most common type of skin cancer, developing in squamous cells.",
      symptoms: [
        "Firm, red nodule",
        "Flat lesion with scaly, crusted surface",
        "New sore or raised area on old scar"
      ],
      imageUrl: "/scc.jpg",
      warningSign: "Often appears on sun-exposed areas including face, ears, and hands."
    },
    {
      type: "Kaposi Sarcoma",
      description: "A rare cancer that develops from blood vessel cells, often associated with weakened immune systems.",
      symptoms: [
        "Purple, red, or brown blotches or tumors on the skin",
        "Raised or flat lesions",
        "Can appear in the mouth or on internal organs",
        "May cause swelling in the legs or lymph nodes"
      ],
      imageUrl: "/Kaposi's_Sarcoma.jpg",
      warningSign: "Common in immunocompromised individuals. Requires immediate medical attention if spots appear."
    },
    {
      type: "Merkel Cell Carcinoma",
      description: "A rare but aggressive skin cancer that usually appears as a flesh-colored or bluish-red nodule.",
      symptoms: [
        "Painless, firm, shiny nodules or lumps",
        "Fast-growing lesions",
        "Usually appears on sun-exposed areas",
        "Can be flesh-colored, red, blue, or purple"
      ],
      imageUrl: "/mcc.webp",
      warningSign: "Highly aggressive - early detection and treatment is crucial. Most common in older adults."
    },
    {
      type: "Sebaceous Gland Carcinoma",
      description: "A rare but aggressive cancer that develops in the oil glands of the skin.",
      symptoms: [
        "Yellow or reddish firm, painless nodules",
        "Most commonly appears on eyelids",
        "Can be mistaken for other eye conditions",
        "May cause eyelash loss"
      ],
      imageUrl: "/sc.jpg",
      warningSign: "Often mimics other benign conditions. Any persistent eyelid abnormality should be evaluated."
    },
    {
      type: "Dermatofibrosarcoma Protuberans",
      description: "A rare skin cancer that begins in the middle layer of skin (dermis).",
      symptoms: [
        "Raised, reddish-brown patch or nodule",
        "Starts as a small bump that grows slowly",
        "Can become larger and more raised over time",
        "May be tender to touch"
      ],
      imageUrl: "/dfpb.jpg",
      warningSign: "Though slow-growing, it can grow deep into surrounding tissue. Early surgical removal is recommended."
    }
  ];

  const skinHealthContent = {
    basics: [
      {
        id: "Rc4J0_Xg88w",
        title: "Understanding Your Skin Type",
        description: "Learn how to identify your skin type and basic care principles for each type.",
        thumbnail: "/thumbnails/skin-types.jpg"
      },
      {
        id: "63YdIH2S2ls",
        title: "Skin Anatomy & Function",
        description: "Detailed explanation of skin layers and their vital roles in protecting your body."
      }
    ],
    conditions: [
      {
        id: "kSz53G0ByKM",
        title: "Common Skin Diseases",
        description: "Overview of acne, eczema, psoriasis, and other frequent skin concerns."
      }
    ],
    treatment: {
      facial: [
        {
          id: "UC6kXyw2Z7ZxQ2mQ9R6Q7zpw",
          title: "Facial Treatments",
          description: "Personalized treatments for different skin types",
          skinTypes: {
            oily: {
              title: "Oily Skin",
              recommendedIngredients: [
                "Salicylic Acid - Unclogs pores and reduces oil",
                "Niacinamide - Controls oil production",
                "Tea Tree Oil - Natural antibacterial properties",
                "Clay (Kaolin/Bentonite) - Absorbs excess oil",
                "Hyaluronic Acid - Light hydration without oil"
              ],
              clinicalTreatments: [
                "Chemical Peels (BHA/AHA based)",
                "Oil-Control Facials",
                "LED Blue Light Therapy",
                "Microdermabrasion",
                "Carbon Laser Peel"
              ]
            },
            dry: {
              title: "Dry Skin",
              recommendedIngredients: [
                "Hyaluronic Acid - Deep hydration",
                "Ceramides - Strengthens skin barrier",
                "Glycerin - Moisture retention",
                "Vitamin E - Nourishing and protective",
                "Squalane - Natural moisturizing"
              ],
              clinicalTreatments: [
                "Hydrating Facials",
                "Gentle Chemical Peels",
                "Oxygen Therapy",
                "Micro-needling with Hyaluronic Acid",
                "LED Red Light Therapy"
              ]
            },
            normal: {
              title: "Normal/Combination Skin",
              recommendedIngredients: [
                "Peptides - Skin firming and balance",
                "Vitamin C - Antioxidant protection",
                "Alpha Arbutin - Even skin tone",
                "Green Tea Extract - Soothing properties",
                "Panthenol - Balancing hydration"
              ],
              clinicalTreatments: [
                "Customized Chemical Peels",
                "Hydra Facial",
                "Laser Skin Resurfacing",
                "Radio Frequency Treatment",
                "Medical-Grade Facials"
              ]
            }
          }
        }
      ],
      body: [
        {
          id: "UC5kXyw2Z7ZxQ2mQ9R6Q7zpw",
          title: "Body Treatments",
          description: "Targeted solutions for body skin concerns",
          skinTypes: {
            oily: {
              title: "Oily/Acne-Prone Body Skin",
              recommendedIngredients: [
                "Benzoyl Peroxide - Antibacterial properties",
                "AHA/BHA Exfoliants - Removes dead skin",
                "Zinc - Regulates oil production",
                "Witch Hazel - Natural astringent",
                "Tea Tree Oil - Antimicrobial properties"
              ],
              clinicalTreatments: [
                "Body Chemical Peels",
                "Back Facials",
                "LED Light Therapy",
                "Salicylic Acid Treatments",
                "Body Acne Laser Therapy"
              ]
            },
            dry: {
              title: "Dry/Sensitive Body Skin",
              recommendedIngredients: [
                "Shea Butter - Deep moisturization",
                "Colloidal Oatmeal - Soothes irritation",
                "Aloe Vera - Healing and hydrating",
                "Urea - Intensive moisturizing",
                "Jojoba Oil - Nourishing properties"
              ],
              clinicalTreatments: [
                "Moisturizing Body Wraps",
                "Gentle Body Polishing",
                "Hydrating Body Masks",
                "Red Light Therapy",
                "Ultrasound Therapy"
              ]
            },
            normal: {
              title: "Normal Body Skin",
              recommendedIngredients: [
                "Vitamin E - Nourishing protection",
                "Coenzyme Q10 - Antioxidant benefits",
                "Glycerin - Balanced hydration",
                "Niacinamide - Skin barrier support",
                "Alpha-Lipoic Acid - Overall skin health"
              ],
              clinicalTreatments: [
                "Body Contouring",
                "Skin Tightening Treatments",
                "Radio Frequency Therapy",
                "Lymphatic Drainage Massage",
                "Body Scrub Treatments"
              ]
            }
          }
        }
      ]
    }
  };

  const riskFactors = [
    {
      id: "1",
      title: "Skin Cancer Risk Factors",
      description: "Common factors that increase risk of developing skin cancer",
      imageUrl: "skin_cancer_risk_factors_umdt.jpg"
    },
  ];

  const SkinCancerCard = ({ cancer }: { cancer: typeof skinCancerInfo[0] }) => {
    const isExpanded = expandedCards.includes(cancer.type);
    
    return (
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb"
        }}
      >
        <div 
          onClick={() => toggleCard(cancer.type)}
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            borderBottom: isExpanded ? "1px solid #e5e7eb" : "none",
            background: isExpanded ? "#f8fafc" : "white",
            transition: "background-color 0.2s"
          }}
        >
          <h3 style={{ color: "#1e40af", margin: 0 }}>{cancer.type}</h3>
          <span style={{ 
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "#1e40af",
            fontSize: "1.2rem"
          }}>
            ›
          </span>
        </div>

        {isExpanded && (
          <>
            <div style={{ position: "relative", paddingTop: "66.67%", backgroundColor: "#f3f4f6" }}>
              <img
                src={cancer.imageUrl}
                alt={`Example of ${cancer.type}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  backgroundColor: "#f3f4f6"
                }}
              />
            </div>
            
            <div style={{ padding: "16px" }}>
              <p style={{ color: "#6b7280", marginBottom: "12px" }}>{cancer.description}</p>
              
              <h4 style={{ color: "#1e40af", marginBottom: "8px" }}>Warning Signs:</h4>
              <ul style={{ 
                color: "#4b5563",
                paddingLeft: "20px",
                marginBottom: "12px"
              }}>
                {cancer.symptoms.map((symptom, index) => (
                  <li key={index} style={{ marginBottom: "4px" }}>{symptom}</li>
                ))}
              </ul>
              
              <div style={{ 
                background: "#fef3c7", 
                border: "1px solid #fde68a",
                borderRadius: "6px",
                padding: "8px",
                marginTop: "12px"
              }}>
                <p style={{ color: "#92400e", margin: 0, fontSize: "0.9rem" }}>
                  {cancer.warningSign}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "120px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "24px", background: "#f8fafc" }}>
      {/* Floating Header with Back Button and Title */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ 
        background: "white", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/">
            <div className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-black group">
              <span className="text-2xl font-light cursor-pointer select-none transition-colors duration-200 text-gray-800 group-hover:text-white">
                ‹
              </span>
            </div>
          </Link>
          <h1 style={{ fontSize: "1.6rem", color: "#1e40af", margin: "0", textAlign: "center", flex: 1, lineHeight: "1.2" }}>
            Skin Health Education Hub
          </h1>
          <div style={{ width: "40px" }}></div> {/* Spacer to center the title */}
        </div>
      </div>

      {/* Subtitle Section */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <p style={{ color: "#6b7280", fontSize: "1.2rem" }}>
          Evidence-based educational resources about skin health and dermatology
        </p>
      </div>

      {/* Skin Basics Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#1e40af", borderBottom: "2px solid #dbeafe", paddingBottom: "8px", marginBottom: "24px" }}>
          Understanding Your Skin
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {skinHealthContent.basics.map((content) => (
            <div
              key={content.id}
              style={{
                background: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb"
              }}
            >
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  title={content.title}
                  src={`https://www.youtube.com/embed/${content.id}`}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div style={{ padding: "16px" }}>
                <h3 style={{ color: "#1e40af", marginTop: 0 }}>{content.title}</h3>
                <p style={{ color: "#6b7280", margin: "8px 0" }}>{content.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skin Cancer Awareness Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ 
          color: "#1e40af", 
          borderBottom: "2px solid #dbeafe", 
          paddingBottom: "8px", 
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>⚠️ Skin Cancer Awareness</span>
        </h2>
        
        <div style={{ marginBottom: "20px" }}>
          <div style={{ 
            background: "#fee2e2", 
            border: "1px solid #fecaca", 
            borderRadius: "8px", 
            padding: "16px",
            marginBottom: "24px",
            textAlign: "center",  // Center the text
            maxWidth: "800px",    // Limit width for better readability
            margin: "0 auto"      // Center the box itself
          }}>
            <p style={{ 
              color: "#991b1b", 
              fontWeight: 500,
              fontSize: "1.1rem",  // Slightly larger text
              margin: 0
            }}>
              Early detection is crucial! Regular self-examination and annual dermatologist visits are recommended.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {skinCancerInfo.map((cancer) => (
            <SkinCancerCard key={cancer.type} cancer={cancer} />
          ))}
        </div>
      </section>

      {/* Risk Factors Section */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{
          color: "#1e40af",
          fontSize: "1.5rem",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e7e7eb"
        }}>
          Skin Cancer Factors
        </h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          padding: "16px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e7e7eb"
        }}>
          {riskFactors.map((factor) => (
            <div key={factor.id} style={{
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <img
                src={factor.imageUrl}
                alt={factor.title}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block"
                }}
              />
              <div style={{ padding: "12px" }}>
                <h4 style={{ color: "#1e40af", marginTop: 0 }}>{factor.title}</h4>
                <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "8px 0 0 0" }}>{factor.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment Section */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#1e40af",
          fontSize: "1.5rem",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e7e7eb" }}>
          What Can You Do for Your Skin?
        </h2>

        {/* Facial Treatments */}
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ 
            color: "#1e40af", 
            fontSize: "1.3rem", 
            marginBottom: "16px",
            paddingLeft: "12px",
            borderLeft: "4px solid #bfdbfe"
          }}>
            Facial Treatments
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {skinHealthContent.treatment.facial.map((content) => (
            <div
              key={content.id}
              style={{
                background: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb"
              }}
            >
              <div style={{ padding: "16px" }}>
                <h4 style={{ color: "#1e40af", marginTop: 0 }}>{content.title}</h4>
                <p style={{ color: "#6b7280", margin: "8px 0" }}>{content.description}</p>
                
                {/* Mobile View - Modern Dropdowns */}
                <div className="md:hidden space-y-4 mt-6">
                  {/* Oily Skin Dropdown */}
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div
                      onClick={() => toggleSkinType(`facial-oily-mobile-${content.id}`)}
                      style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: expandedSkinTypes.includes(`facial-oily-mobile-${content.id}`) ? "1px solid #e5e7eb" : "none",
                        background: expandedSkinTypes.includes(`facial-oily-mobile-${content.id}`) ? "#f8fafc" : "white",
                        transition: "background-color 0.2s"
                      }}
                    >
                      <h3 style={{ color: "#1e40af", margin: 0 }}>{content.skinTypes.oily.title}</h3>
                      <span style={{ 
                        transform: expandedSkinTypes.includes(`facial-oily-mobile-${content.id}`) ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "#1e40af",
                        fontSize: "1.2rem"
                      }}>
                        ›
                      </span>
                    </div>
                    <div className={`dropdown-content ${expandedSkinTypes.includes(`facial-oily-mobile-${content.id}`) ? 'open' : ''}`}>
                      <div className="px-6 pb-4">
                        <div className="mb-4">
                          <h6 className="text-blue-400 font-medium mb-2">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-medium mb-2">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dry Skin Dropdown */}
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div
                      onClick={() => toggleSkinType(`facial-dry-mobile-${content.id}`)}
                      style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: expandedSkinTypes.includes(`facial-dry-mobile-${content.id}`) ? "1px solid #e5e7eb" : "none",
                        background: expandedSkinTypes.includes(`facial-dry-mobile-${content.id}`) ? "#f8fafc" : "white",
                        transition: "background-color 0.2s"
                      }}
                    >
                      <h3 style={{ color: "#1e40af", margin: 0 }}>{content.skinTypes.dry.title}</h3>
                      <span style={{ 
                        transform: expandedSkinTypes.includes(`facial-dry-mobile-${content.id}`) ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "#1e40af",
                        fontSize: "1.2rem"
                      }}>
                        ›
                      </span>
                    </div>
                    <div className={`dropdown-content ${expandedSkinTypes.includes(`facial-dry-mobile-${content.id}`) ? 'open' : ''}`}>
                      <div className="px-6 pb-4">
                        <div className="mb-4">
                          <h6 className="text-blue-400 font-medium mb-2">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-medium mb-2">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Normal Skin Dropdown */}
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div
                      onClick={() => toggleSkinType(`facial-normal-mobile-${content.id}`)}
                      style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: expandedSkinTypes.includes(`facial-normal-mobile-${content.id}`) ? "1px solid #e5e7eb" : "none",
                        background: expandedSkinTypes.includes(`facial-normal-mobile-${content.id}`) ? "#f8fafc" : "white",
                        transition: "background-color 0.2s"
                      }}
                    >
                      <h3 style={{ color: "#1e40af", margin: 0 }}>{content.skinTypes.normal.title}</h3>
                      <span style={{ 
                        transform: expandedSkinTypes.includes(`facial-normal-mobile-${content.id}`) ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "#1e40af",
                        fontSize: "1.2rem"
                      }}>
                        ›
                      </span>
                    </div>
                    <div className={`dropdown-content ${expandedSkinTypes.includes(`facial-normal-mobile-${content.id}`) ? 'open' : ''}`}>
                      <div className="px-6 pb-4">
                        <div className="mb-4">
                          <h6 className="text-blue-400 font-medium mb-2">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-medium mb-2">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PC View - Flip Cards */}
                <div className="hidden md:grid grid-cols-3 gap-6 mt-6">
                  {/* Oily Skin */}
                  <div className="perspective-1000">
                    <div 
                      className={`relative transform-style-3d cursor-pointer transition-transform duration-500 w-full h-[400px] ${
                        expandedSkinTypes.includes(`facial-oily-${content.id}`) ? 'rotate-y-180' : ''
                      }`}
                      onClick={() => toggleSkinType(`facial-oily-${content.id}`)}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h5 className="text-xl font-semibold mb-4" style={{ color: "#1e40af" }}>{content.skinTypes.oily.title}</h5>
                        <p className="text-gray-600 text-center">Click to see recommended treatments and ingredients</p>
                      </div>
                      
                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6">
                          <h6 className="text-blue-400 font-semibold mb-3">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-semibold mb-3">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dry Skin */}
                  <div className="perspective-1000">
                    <div 
                      className={`relative transform-style-3d cursor-pointer transition-transform duration-500 w-full h-[400px] ${
                        expandedSkinTypes.includes(`facial-dry-${content.id}`) ? 'rotate-y-180' : ''
                      }`}
                      onClick={() => toggleSkinType(`facial-dry-${content.id}`)}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h5 className="text-xl font-semibold mb-4" style={{ color: "#1e40af" }}>{content.skinTypes.dry.title}</h5>
                        <p className="text-gray-600 text-center">Click to see recommended treatments and ingredients</p>
                      </div>
                      
                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6">
                                                    <h6 className="text-blue-400 font-semibold mb-3">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-semibold mb-3">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Normal Skin */}
                  <div className="perspective-1000">
                    <div 
                      className={`relative transform-style-3d cursor-pointer transition-transform duration-500 w-full h-[400px] ${
                        expandedSkinTypes.includes(`facial-normal-${content.id}`) ? 'rotate-y-180' : ''
                      }`}
                      onClick={() => toggleSkinType(`facial-normal-${content.id}`)}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h5 className="text-xl font-semibold mb-4" style={{ color: "#1e40af" }}>{content.skinTypes.normal.title}</h5>
                        <p className="text-gray-600 text-center">Click to see recommended treatments and ingredients</p>
                      </div>
                      
                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6">
                          <h6 className="text-blue-400 font-semibold mb-3">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-semibold mb-3">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Body Treatments */}
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ 
            color: "#1e40af", 
            fontSize: "1.3rem", 
            marginBottom: "16px",
            paddingLeft: "12px",
            borderLeft: "4px solid #bfdbfe"
          }}>
            Body Treatments
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {skinHealthContent.treatment.body.map((content) => (
            <div
              key={content.id}
              style={{
                background: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb"
              }}
            >
              <div style={{ padding: "16px" }}>
                <h4 style={{ color: "#1e40af", marginTop: 0 }}>{content.title}</h4>
                <p style={{ color: "#6b7280", margin: "8px 0" }}>{content.description}</p>
                
                {/* Mobile View - Modern Dropdowns */}
                <div className="md:hidden space-y-4 mt-6">
                  {/* Oily/Acne-Prone Body Skin Dropdown */}
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div
                      onClick={() => toggleSkinType(`body-oily-mobile-${content.id}`)}
                      style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: expandedSkinTypes.includes(`body-oily-mobile-${content.id}`) ? "1px solid #e5e7eb" : "none",
                        background: expandedSkinTypes.includes(`body-oily-mobile-${content.id}`) ? "#f8fafc" : "white",
                        transition: "background-color 0.2s"
                      }}
                    >
                      <h3 style={{ color: "#1e40af", margin: 0 }}>{content.skinTypes.oily.title}</h3>
                      <span style={{ 
                        transform: expandedSkinTypes.includes(`body-oily-mobile-${content.id}`) ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "#1e40af",
                        fontSize: "1.2rem"
                      }}>
                        ›
                      </span>
                    </div>
                    <div className={`dropdown-content ${expandedSkinTypes.includes(`body-oily-mobile-${content.id}`) ? 'open' : ''}`}>
                      <div className="px-6 pb-4">
                        <div className="mb-4">
                          <h6 className="text-blue-400 font-medium mb-2">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-medium mb-2">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dry/Sensitive Body Skin Dropdown */}
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div
                      onClick={() => toggleSkinType(`body-dry-mobile-${content.id}`)}
                      style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: expandedSkinTypes.includes(`body-dry-mobile-${content.id}`) ? "1px solid #e5e7eb" : "none",
                        background: expandedSkinTypes.includes(`body-dry-mobile-${content.id}`) ? "#f8fafc" : "white",
                        transition: "background-color 0.2s"
                      }}
                    >
                      <h3 style={{ color: "#1e40af", margin: 0 }}>{content.skinTypes.dry.title}</h3>
                      <span style={{ 
                        transform: expandedSkinTypes.includes(`body-dry-mobile-${content.id}`) ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "#1e40af",
                        fontSize: "1.2rem"
                      }}>
                        ›
                      </span>
                    </div>
                    <div className={`dropdown-content ${expandedSkinTypes.includes(`body-dry-mobile-${content.id}`) ? 'open' : ''}`}>
                      <div className="px-6 pb-4">
                        <div className="mb-4">
                          <h6 className="text-blue-400 font-medium mb-2">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-medium mb-2">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Normal Body Skin Dropdown */}
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div
                      onClick={() => toggleSkinType(`body-normal-mobile-${content.id}`)}
                      style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: expandedSkinTypes.includes(`body-normal-mobile-${content.id}`) ? "1px solid #e5e7eb" : "none",
                        background: expandedSkinTypes.includes(`body-normal-mobile-${content.id}`) ? "#f8fafc" : "white",
                        transition: "background-color 0.2s"
                      }}
                    >
                      <h3 style={{ color: "#1e40af", margin: 0 }}>{content.skinTypes.normal.title}</h3>
                      <span style={{ 
                        transform: expandedSkinTypes.includes(`body-normal-mobile-${content.id}`) ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        color: "#1e40af",
                        fontSize: "1.2rem"
                      }}>
                        ›
                      </span>
                    </div>
                    <div className={`dropdown-content ${expandedSkinTypes.includes(`body-normal-mobile-${content.id}`) ? 'open' : ''}`}>
                      <div className="px-6 pb-4">
                        <div className="mb-4">
                          <h6 className="text-blue-400 font-medium mb-2">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-medium mb-2">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PC View - Flip Cards */}
                <div className="hidden md:grid grid-cols-3 gap-6 mt-6">
                  {/* Oily/Acne-Prone Body Skin */}
                  <div className="perspective-1000">
                    <div 
                      className={`relative transform-style-3d cursor-pointer transition-transform duration-500 w-full h-[400px] ${
                        expandedSkinTypes.includes(`body-oily-${content.id}`) ? 'rotate-y-180' : ''
                      }`}
                      onClick={() => toggleSkinType(`body-oily-${content.id}`)}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h5 className="text-xl font-semibold mb-4" style={{ color: "#1e40af" }}>{content.skinTypes.oily.title}</h5>
                        <p className="text-gray-600 text-center">Click to see recommended treatments and ingredients</p>
                      </div>
                      
                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6">
                          <h6 className="text-blue-400 font-semibold mb-3">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-semibold mb-3">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.oily.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dry/Sensitive Body Skin */}
                  <div className="perspective-1000">
                    <div 
                      className={`relative transform-style-3d cursor-pointer transition-transform duration-500 w-full h-[400px] ${
                        expandedSkinTypes.includes(`body-dry-${content.id}`) ? 'rotate-y-180' : ''
                      }`}
                      onClick={() => toggleSkinType(`body-dry-${content.id}`)}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h5 className="text-xl font-semibold mb-4" style={{ color: "#1e40af" }}>{content.skinTypes.dry.title}</h5>
                        <p className="text-gray-600 text-center">Click to see recommended treatments and ingredients</p>
                      </div>
                      
                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6">
                          <h6 className="text-blue-400 font-semibold mb-3">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-semibold mb-3">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.dry.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Normal Body Skin */}
                  <div className="perspective-1000">
                    <div 
                      className={`relative transform-style-3d cursor-pointer transition-transform duration-500 w-full h-[400px] ${
                        expandedSkinTypes.includes(`body-normal-${content.id}`) ? 'rotate-y-180' : ''
                      }`}
                      onClick={() => toggleSkinType(`body-normal-${content.id}`)}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
                        <h5 className="text-xl font-semibold mb-4" style={{ color: "#1e40af" }}>{content.skinTypes.normal.title}</h5>
                        <p className="text-gray-600 text-center">Click to see recommended treatments and ingredients</p>
                      </div>
                      
                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-y-auto">
                        <div className="mb-6">
                          <h6 className="text-blue-400 font-semibold mb-3">Recommended Ingredients:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.recommendedIngredients.map((ingredient, index) => (
                              <li key={index}>{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-blue-400 font-semibold mb-3">Clinical Treatments:</h6>
                          <ul className="space-y-2 text-gray-600 text-sm">
                            {content.skinTypes.normal.clinicalTreatments.map((treatment, index) => (
                              <li key={index}>{treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      <footer style={{ marginTop: "40px", textAlign: "center", padding: "20px", borderTop: "1px solid #e5e7eb" }}>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          This is general educational content only. For further confirmation and personalized medical advice, please consult with a certified dermatologist.
        </p>
      </footer>
    </div>
  );
}