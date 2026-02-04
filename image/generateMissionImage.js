const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");
const operatorImages = require("../operatorImages");

function normalizeKey(name) {
  if (!name) return "";
  return name.toString().toLowerCase().trim().replace(/\s+/g, "_").replace(/\.+/g, "");
}

function possibleFileNames(base) {
  const variants = [];
  if (base) variants.push(base);
  const noExt = base ? base.replace(/\.[^.]+$/, "") : base;
  if (noExt) {
    variants.push(noExt + ".png");
    variants.push(noExt + ".jpeg");
    variants.push(noExt + ".jpg");
    variants.push(noExt + ".png.jpeg");
    variants.push(noExt + ".png.jpg");
  }
  return Array.from(new Set(variants));
}

// Try these directories (order matters). Add others if your repo uses a different path.
const operatorDirs = [
  path.join(process.cwd(), "images", "operators"),
  path.join(process.cwd(), "image", "operators"),
  path.join(__dirname, "..", "images", "operators"),
  path.join(__dirname, "..", "image", "operators"),
  path.join(process.cwd(), "assets", "image", "operators"),
  path.join(process.cwd(), "assets", "images", "operators")
];

// Helper: Draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// High-value missions that get glow effect
const highValueMissions = ["B.S.S", "Breach", "Clean Up"];

module.exports = async function generateMissionImage(missions) {
  const width = 1600;
  const opsPerRow = 5;
  const opTileWidth = 100;
  const opTileHeight = 150; // INCREASED for better name visibility
  const rowHeight = 160; // INCREASED to match new tile height
  
  // Calculate dynamic height based on SELECTED missions only (no Skip)
  let estimatedHeight = 140; // header area
  const selectedMissions = missions.filter(m => m.name !== "Skip");
  for (const mission of selectedMissions) {
    const operatorCount = mission.operators.length;
    const rowsNeeded = Math.ceil(operatorCount / opsPerRow);
    const missionCardHeight = 140 + (rowsNeeded * rowHeight); // adjusted for new spacing
    estimatedHeight += missionCardHeight + 30; // mission + spacing
  }
  estimatedHeight += 60; // footer area
  const height = Math.max(estimatedHeight, 600); // minimum height
  
  console.log(`Canvas size: ${width}x${height}, Selected missions: ${selectedMissions.length}`);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#061C37";
  ctx.fillRect(0, 0, width, height);

  // ===== HEADER =====
  // Gradient text for TACTIOPBOT
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#7FC9E8");
  gradient.addColorStop(1, "#FFFFFF");
  ctx.fillStyle = gradient;
  ctx.font = "bold 72px Courier New";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 150, 255, 0.4)";
  ctx.shadowBlur = 8;
  ctx.fillText("TACTIOPBOT", width / 2, 70);
  ctx.shadowBlur = 0;

  // Divider line under header
  ctx.strokeStyle = "#3FA9F5";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 150, 95);
  ctx.lineTo(width / 2 + 150, 95);
  ctx.stroke();

  let y = 140;

  // ===== MISSIONS (only selected, no Skip) =====
  for (const mission of selectedMissions) {

    const isHighValue = highValueMissions.includes(mission.name);
    const cardPadding = 20;
    const cardX = 40;
    const cardY = y;
    const cardWidth = width - 80;
    
    // DYNAMIC: Calculate card height based on operator count
    const operatorCount = mission.operators.length;
    const rowsNeeded = Math.ceil(operatorCount / opsPerRow);
    const cardHeight = operatorCount > 0 ? 130 + (rowsNeeded * rowHeight) : 100;

    // Draw card with glow effect for high-value missions
    if (isHighValue) {
      ctx.fillStyle = "rgba(63, 169, 245, 0.2)";
      drawRoundedRect(ctx, cardX - 5, cardY - 5, cardWidth + 10, cardHeight + 10, 18);
      ctx.fill();
    }

    // Card background - MUCH MORE VISIBLE
    ctx.fillStyle = "#0b2a44";
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 14);
    ctx.fill();

    // Card border - brighter
    ctx.strokeStyle = "#1e5fa3";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 14);
    ctx.stroke();

    // Mission title - PURE WHITE, BIGGER, WITH GLOW
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 52px Courier New";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0, 150, 255, 0.5)";
    ctx.shadowBlur = 6;
    const missionText = String(mission.name).trim();
    ctx.fillText(missionText, cardX + cardPadding, cardY + 52);
    ctx.shadowBlur = 0;

    // Strong accent line under mission title
    ctx.strokeStyle = "#3FA9F5";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cardX + cardPadding, cardY + 70);
    ctx.lineTo(cardX + cardPadding + 250, cardY + 70);
    ctx.stroke();

    let opX = cardX + cardPadding;
    let opY = cardY + 100;

    let opCount = 0;

    // ===== OPERATOR CARDS =====
    for (const op of mission.operators || []) {
      const key = normalizeKey(op.name);
      const mapped = operatorImages[key] || operatorImages[op.name] || operatorImages[op.name && op.name.trim()];

      const candidates = [];
      if (mapped) candidates.push(...possibleFileNames(mapped));
      candidates.push(...possibleFileNames(key));
      candidates.push(...possibleFileNames(op.name));

      let foundPath = null;
      const tried = [];

      for (const dir of operatorDirs) {
        for (const fname of candidates) {
          if (!fname) continue;
          const imgPath = path.join(dir, fname);
          if (tried.includes(imgPath)) continue;
          tried.push(imgPath);
          if (fs.existsSync(imgPath)) {
            foundPath = imgPath;
            break;
          }
        }
        if (foundPath) break;
      }

      if (!foundPath) {
        console.log(`No operator image found for "${op.name}"`);
        continue;
      }

      try {
        // Operator tile background - LIGHTER and MORE VISIBLE
        ctx.fillStyle = "#0f3557";
        drawRoundedRect(ctx, opX, opY, opTileWidth, opTileHeight, 10);
        ctx.fill();

        // Operator tile border - BRIGHTER
        ctx.strokeStyle = "#1e5fa3";
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, opX, opY, opTileWidth, opTileHeight, 10);
        ctx.stroke();

        // Load and draw operator image
        const img = await loadImage(foundPath);
        ctx.drawImage(img, opX + 5, opY + 5, 90, 90);

        // Operator name - BRIGHT WHITE with STRONG SHADOW for readability
        // Position at bottom of tile with proper spacing
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 15px Courier New";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 6;
        const opNameText = String(op.name).trim();
        ctx.fillText(opNameText, opX + opTileWidth / 2, opY + opTileHeight - 12);
        ctx.shadowBlur = 0;

        opCount++;
        opX += 115;

        // Wrap to next row
        if (opCount % opsPerRow === 0) {
          opX = cardX + cardPadding;
          opY += 145;
        }
      } catch (e) {
        console.log("Failed to load/draw image:", foundPath, e && e.message);
      }
    }

    y = cardY + cardHeight + 30;
  }

  // ===== FOOTER (ALWAYS drawn, no conditions) =====
  ctx.shadowBlur = 0; // reset any shadow state
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "bold 16px Courier New";
  ctx.textAlign = "right";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 3;
  ctx.fillText("Powered by ytmazen", width - 40, height - 20);
  ctx.shadowBlur = 0;

  const buffer = canvas.toBuffer("image/png");
  console.log("✅ IMAGE GENERATED:", buffer ? buffer.length : "null/undefined");
  return buffer;
};