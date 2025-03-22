import React, { useState, useCallback } from "react";
import { Track, BlockType } from "../types";

interface TrackSettingsDrawerProps {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
}

// 스타일 객체
const styles = {
  toggleButton: {
    position: "fixed" as const,
    top: "20px",
    right: "20px",
    padding: "10px 20px",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    zIndex: 1000,
    transition: "background-color 0.2s",
  },
  drawer: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    width: "300px",
    height: "100%",
    backgroundColor: "#f9f9f9",
    boxShadow: "-2px 0 5px rgba(0,0,0,0.2)",
    padding: "20px",
    zIndex: 999,
    overflowY: "auto" as const,
    transition: "transform 0.3s ease-in-out",
  },
  drawerClosed: {
    transform: "translateX(100%)",
  },
  drawerOpen: {
    transform: "translateX(0)",
  },
  title: {
    marginBottom: "20px",
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  trackSection: {
    marginBottom: "20px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#fff",
  },
  trackTitle: {
    fontSize: "1.1rem",
    marginBottom: "10px",
  },
  checkboxContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  },
};

export const TrackSettingsDrawer: React.FC<TrackSettingsDrawerProps> = ({
  tracks,
  setTracks,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const typeOptions: { value: BlockType | "all"; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: BlockType.Video, label: "Video" },
    { value: BlockType.Audio, label: "Audio" },
    { value: BlockType.Animation, label: "Animation" },
  ];

  const handleTypeChange = useCallback(
    (trackId: string, value: BlockType | "all", checked: boolean) => {
      setTracks((prev) =>
        prev.map((t) => {
          if (t.id !== trackId) return t;
          const allowedTypes = t.allowedTypes ?? [];

          if (value === "all") {
            // "All" 체크 시 모든 타입 허용 (빈 배열)
            return {
              ...t,
              allowedTypes: checked
                ? []
                : [BlockType.Video, BlockType.Audio, BlockType.Animation],
            };
          } else {
            // 개별 타입 토글
            const newTypes = checked
              ? [...allowedTypes, value]
              : allowedTypes.filter((type) => type !== value);
            return { ...t, allowedTypes: newTypes };
          }
        })
      );
    },
    [setTracks]
  );

  const isAllSelected = (track: Track) => {
    const allowedTypes = track.allowedTypes ?? [];
    return allowedTypes.length === 0; // 빈 배열이면 "All" 선택 상태
  };

  const isTypeSelected = (track: Track, type: BlockType) => {
    const allowedTypes = track.allowedTypes ?? [];
    return allowedTypes.includes(type);
  };

  return (
    <>
      <button
        style={styles.toggleButton}
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#1976d2")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#2196f3")
        }
      >
        {isOpen ? "설정 닫기" : "트랙 설정 열기"}
      </button>
      <div
        style={{
          ...styles.drawer,
          ...(isOpen ? styles.drawerOpen : styles.drawerClosed),
        }}
      >
        <h2 style={styles.title}>트랙 설정</h2>
        {tracks.length === 0 ? (
          <p style={{ color: "#666" }}>트랙이 없습니다.</p>
        ) : (
          tracks.map((track) => (
            <div key={track.id} style={styles.trackSection}>
              <h3 style={styles.trackTitle}>{track.label}</h3>
              <div style={styles.checkboxContainer}>
                {typeOptions.map((option) => (
                  <label key={option.value} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={
                        option.value === "all"
                          ? isAllSelected(track)
                          : isTypeSelected(track, option.value as BlockType)
                      }
                      onChange={(e) =>
                        handleTypeChange(
                          track.id,
                          option.value,
                          e.target.checked
                        )
                      }
                      disabled={option.value !== "all" && isAllSelected(track)} // "All" 선택 시 개별 타입 비활성화
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
