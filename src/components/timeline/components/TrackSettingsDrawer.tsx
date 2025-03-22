import React, { useState } from "react";
import Select from "react-select";
import { Track, BlockType } from "../types";

interface TrackSettingsDrawerProps {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
}

export const TrackSettingsDrawer: React.FC<TrackSettingsDrawerProps> = ({
  tracks,
  setTracks,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: BlockType.Video, label: "Video" },
    { value: BlockType.Audio, label: "Audio" },
    { value: BlockType.Animation, label: "Animation" },
    // 추가 타입은 여기서 확장 가능
  ];

  const handleTypeChange = (trackId: string, selected: any) => {
    const newTypes = selected.some((opt: any) => opt.value === "all")
      ? []
      : (selected.map((opt: any) => opt.value) as BlockType[]);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, allowedTypes: newTypes } : t))
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "10px 20px",
          backgroundColor: "#2196f3",
          color: "white",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        {isOpen ? "설정 닫기" : "트랙 설정 열기"}
      </button>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "300px",
            height: "100%",
            backgroundColor: "#f9f9f9",
            boxShadow: "-2px 0 5px rgba(0,0,0,0.2)",
            padding: "20px",
            zIndex: 999,
            overflowY: "auto",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>트랙 설정</h2>
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{
                marginBottom: "20px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <h3>{track.label}</h3>
              <Select
                isMulti
                options={typeOptions}
                value={
                  track.allowedTypes?.length === 0
                    ? [typeOptions[0]]
                    : typeOptions.filter((opt) =>
                        track.allowedTypes?.includes(opt.value as BlockType)
                      )
                }
                onChange={(selected) => handleTypeChange(track.id, selected)}
                placeholder="허용된 타입 선택"
                styles={{
                  control: (base) => ({ ...base, fontSize: "14px" }),
                  menu: (base) => ({ ...base, width: "100%" }),
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
};
