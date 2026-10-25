// Patch IGO: trang avatar đứng riêng — Agent Office nhúng để hiển thị đúng
// nhân vật pixel của Habblaud (?seed=<tên vai>&scale=2). Cùng công thức với
// office: seed=hash32(tên), look từ pickName(tên).
import { avatarCanvas } from './art';
import { hash32 } from '../../shared/hash';
import { pickName } from '../../shared/names';

const q = new URLSearchParams(location.search);
const seedStr = q.get('seed') || 'agent';
const scale = Math.max(1, Math.min(6, Number(q.get('scale') || 2)));
const canvas = avatarCanvas(hash32(seedStr), {
  look: pickName(seedStr, new Set()).look,
  scale,
});
canvas.style.imageRendering = 'pixelated';
document.body.appendChild(canvas);
