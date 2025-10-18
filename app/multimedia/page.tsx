import React from "react";
import MultimediaContent from "../../components/multimedia/MultimediaContent";

export const metadata = {
  title: "Multimedia — Dermatology Education",
  description: "Curated multimedia resources (video & audio) about skin health and dermatology.",
};

export default function MultimediaPage() {
  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <MultimediaContent />
    </main>
  );
}