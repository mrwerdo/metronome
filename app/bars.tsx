import React from "react";
import type { BarType } from "./data";

interface BarProps {
  bar: BarType;
  isActive: boolean;
  // zero indexd, and which means that it will always be less than bar.numberOfBars
  currentBar: number;
}

const Bar: React.FC<BarProps> = ({ bar, isActive, currentBar }) => {
  const barStyle = {
    padding: "10px",
    margin: "5px",
    border: "1px solid black",
    backgroundColor: isActive ? "#7692FF" : "#ABD2FA",
  };
  const renderProgressBoxes = () => {
    const boxes = [];
    for (let i = 0; i < bar.numberOfBars; i++) {
      boxes.push(
        <div
          key={i}
          style={{
            width: "20px",
            height: "20px",
            margin: "2px",
            backgroundColor: (isActive && i === currentBar) ? "#FF5733" : "#D3D3D3",
            display: "inline-block",
          }}
        ></div>
      );
    }
    return boxes;
  };
  return (
    <div style={barStyle}>
      <h3>{bar.name}</h3>
      {renderProgressBoxes()}
    </div>
  );
};

export default Bar;
