import { useState, useRef, useEffect, useCallback } from "react";

const FONTS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playwrite+CU+Guides&family=Playwrite+NZ+Basic&display=swap');
`;

const BG = "#f5f0e8";
const ORANGE = "#ff6d00";
const ORANGE_LIGHT = "#ffab40";
const BLACK = "#1a1a1a";
const BORDER = `3px solid ${BLACK}`;
const SHADOW = `5px 5px 0px ${BLACK}`;
const TEAL = "#00bfa5";
const LOCK_RED = "#c62828";
const GREEN = "#2e7d32";
const PURPLE = "#6a1b9a";

function InfoOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{position:"absolute",top:0,left:0,right:0,bottom:0,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.35)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:BORDER,boxShadow:`6px 6px 0px ${BLACK}`,padding:"24px 28px",maxWidth:"460px",width:"90%",fontFamily:"'Playwrite NZ Basic', cursive",fontSize:"13px",lineHeight:"1.75",color:BLACK,position:"relative",borderRadius:0,maxHeight:"80vh",overflowY:"auto"}}>
        <button onClick={onClose} style={{position:"absolute",top:8,right:12,background:"none",border:"none",fontSize:"20px",cursor:"pointer",color:BLACK,fontWeight:"bold",fontFamily:"monospace"}}>✕</button>
        <h3 style={{fontFamily:"'Playwrite CU Guides', cursive",fontSize:"16px",margin:"0 0 14px 0",background:ORANGE,display:"inline-block",padding:"4px 10px",border:`2px solid ${BLACK}`}}>Grübler's Formula</h3>
        <p style={{margin:"0 0 10px 0"}}><strong>dof = m(N - 1 - J) + Σfᵢ</strong></p>
        <p style={{margin:"0 0 10px 0"}}>This formula calculates the degrees of freedom of a mechanism, i.e. the number of independent parameters needed to fully specify its configuration.</p>
        <ul style={{margin:"0 0 10px 0",paddingLeft:"20px",listStyleType:"disc"}}>
          <li style={{marginBottom:"6px"}}><strong>m</strong> = freedoms of a single rigid link moving freely. In 3D space m = 6 and in 2D space m = 3.</li>
          <li style={{marginBottom:"6px"}}><strong>N</strong> = total number of links, including the ground link. Including the ground link is historic convention.</li>
          <li style={{marginBottom:"6px"}}><strong>J</strong> = total number of joints connecting the links.</li>
          <li style={{marginBottom:"6px"}}><strong>fᵢ</strong> = number of freedoms that joint i allows. A revolute or prismatic joint has fᵢ = 1. A universal joint has fᵢ = 2. A spherical joint has fᵢ = 3.</li>
        </ul>
        <p style={{margin:"0 0 10px 0"}}><strong>How it works in three steps:</strong> First, disconnect all links. N - 1 links float freely (excluding ground), each with m freedoms, giving m(N - 1) total freedoms. Second, reconnect the links with joints, but pretend every joint is completely frozen and allows no motion. Each joint removes all m relative freedoms between the two links it connects. J joints remove mJ freedoms, leaving m(N - 1 - J). Third, unlock the joints. Each joint i actually allows fᵢ freedoms. Add those back: m(N - 1 - J) + Σfᵢ.</p>
        <p style={{margin:"0 0 0 0"}}><strong>Assumptions:</strong> The formula assumes all joint constraints are independent. It is purely topological: it counts links and joints but knows nothing about the actual geometry of the mechanism. It can give incorrect results for mechanisms with special geometries that create redundant constraints.</p>
      </div>
    </div>
  );
}

const LINK_COLORS = ["#aaa","#e65100","#ff8f00","#f9a825","#43a047","#00897b","#1565c0"];

export default function GrublerVisualization() {
  const [example, setExample] = useState("joints");
  const [stage, setStage] = useState(1);
  const [jointType, setJointType] = useState("revolute");
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const tick = () => { animRef.current += 0.012; drawCanvas(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, example, jointType]);

  const drawCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#fffbf0";
    ctx.fillRect(0,0,W,H);
    if (example === "joints") drawJointType(ctx,W,H);
    else if (example === "arm") { if (stage===1) drawArmStage1(ctx,W,H); else if (stage===2) drawArmStage2(ctx,W,H); else drawArmStage3(ctx,W,H); }
    else drawDoor(ctx,W,H);
  }, [stage, example, jointType]);

  const drawLinkLine = (ctx: CanvasRenderingContext2D,x1: number,y1: number,x2: number,y2: number,color: string,width: number) => {
    ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.lineCap="butt";
  };

  const drawGround = (ctx: CanvasRenderingContext2D,x: number,y: number,w: number) => {
    ctx.strokeStyle="#999"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y); ctx.stroke();
    for (let i=0;i<5;i++){const lx=x+5+i*((w-10)/4); ctx.beginPath(); ctx.moveTo(lx,y); ctx.lineTo(lx-7,y+10); ctx.strokeStyle="#bbb"; ctx.lineWidth=1.2; ctx.stroke();}
  };

  const drawJointCircle = (ctx: CanvasRenderingContext2D,x: number,y: number,locked: boolean,freed: boolean,label?: string) => {
    const r=7;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle=BLACK; ctx.lineWidth=2; ctx.stroke();
    if (locked){ctx.strokeStyle=LOCK_RED; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-3.5,y-3.5); ctx.lineTo(x+3.5,y+3.5); ctx.moveTo(x+3.5,y-3.5); ctx.lineTo(x-3.5,y+3.5); ctx.stroke();}
    if (freed){const t=animRef.current; const ang=t*2+x*0.02; ctx.strokeStyle=TEAL; ctx.lineWidth=1.8; ctx.beginPath(); ctx.arc(x,y,r+5,ang,ang+Math.PI*0.7); ctx.stroke(); const ex2=x+(r+5)*Math.cos(ang+Math.PI*0.7); const ey2=y+(r+5)*Math.sin(ang+Math.PI*0.7); const ea=ang+Math.PI*0.7+Math.PI/2; ctx.beginPath(); ctx.moveTo(ex2,ey2); ctx.lineTo(ex2+4*Math.cos(ea-0.5),ey2+4*Math.sin(ea-0.5)); ctx.stroke();}
    if (label){const lx2=28; ctx.strokeStyle="#ccc"; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(lx2+18,y); ctx.lineTo(x-r-2,y); ctx.stroke(); ctx.setLineDash([]); ctx.font="bold 11px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#666"; ctx.textAlign="left"; ctx.textBaseline="middle"; ctx.fillText(label,lx2,y);}
  };

  const drawAxes = (ctx: CanvasRenderingContext2D,cx: number,cy: number,size: number) => {
    const s=size;
    ctx.strokeStyle="#e53935"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+s,cy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+s,cy); ctx.lineTo(cx+s-4,cy-3); ctx.stroke();
    ctx.strokeStyle="#43a047"; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx,cy-s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx,cy-s); ctx.lineTo(cx-3,cy-s+4); ctx.stroke();
    ctx.strokeStyle="#1e88e5"; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx-s*0.6,cy+s*0.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx-s*0.6,cy+s*0.6); ctx.lineTo(cx-s*0.6+4,cy+s*0.6-2); ctx.stroke();
    ctx.globalAlpha=0.4;
    ctx.strokeStyle="#e53935"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx+s*0.6,cy,5,-Math.PI*0.8,Math.PI*0.3); ctx.stroke();
    ctx.strokeStyle="#43a047"; ctx.beginPath(); ctx.arc(cx,cy-s*0.6,5,Math.PI*0.2,Math.PI*1.3); ctx.stroke();
    ctx.strokeStyle="#1e88e5"; ctx.beginPath(); ctx.arc(cx-s*0.35,cy+s*0.35,5,-Math.PI*0.5,Math.PI*0.5); ctx.stroke();
    ctx.globalAlpha=1;
  };

  // ---- JOINT TYPE DRAWINGS ----
  const drawJointType = (ctx: CanvasRenderingContext2D,W: number,H: number) => {
    if (jointType==="revolute") drawRevoluteJoint(ctx,W,H);
    else if (jointType==="prismatic") drawPrismaticJoint(ctx,W,H);
    else drawSphericalJoint(ctx,W,H);
  };

  const drawRightInfo = (ctx: CanvasRenderingContext2D,W: number,title: string,desc1: string,desc2: string,desc3?: string,desc4?: string,desc5?: string,constraints?: number,freedoms?: number,blocks?: string[]) => {
    const rx=W/2+80, ry=80;
    ctx.font="bold 16px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=BLACK; ctx.textAlign="left"; ctx.fillText(title,rx,ry);
    ctx.font="12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#666";
    ctx.fillText(desc1,rx,ry+30); ctx.fillText(desc2,rx,ry+50);
    if(desc3) ctx.fillText(desc3,rx,ry+85);
    if(desc4) ctx.fillText(desc4,rx,ry+105);
    if(desc5) ctx.fillText(desc5,rx,ry+125);
    const boff = desc5 ? 155 : desc4 ? 135 : 115;
    const by=ry+boff;
    ctx.fillStyle="#fef2f2"; ctx.fillRect(rx,by,130,36); ctx.strokeStyle="#fecaca"; ctx.lineWidth=1.5; ctx.strokeRect(rx,by,130,36);
    ctx.font="bold 12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=LOCK_RED; ctx.textAlign="left"; ctx.fillText("Constraints: "+constraints,rx+10,by+23);
    ctx.fillStyle="#f0fdf4"; ctx.fillRect(rx,by+46,130,36); ctx.strokeStyle="#bbf7d0"; ctx.lineWidth=1.5; ctx.strokeRect(rx,by+46,130,36);
    ctx.font="bold 12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=GREEN; ctx.fillText("Freedoms: "+freedoms,rx+10,by+69);
    const my2=by+110;
    ctx.font="bold 11px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=BLACK; ctx.fillText("Blocks:",rx,my2);
    ctx.font="11px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=LOCK_RED;
    blocks?.forEach((b,i)=>ctx.fillText("• "+b,rx,my2+20+i*20));
    return ry;
  };

  const drawRevoluteJoint = (ctx: CanvasRenderingContext2D,W: number,H: number) => {
    const t=animRef.current;
    const cx=190, cy=H/2;
    const link1Len=120, link2Len=110;
    const angle=Math.sin(t*1.2)*0.4;

    drawLinkLine(ctx,cx-link1Len,cy,cx,cy,"#475569",10);
    const ex=cx+link2Len*Math.cos(angle), ey=cy-link2Len*Math.sin(angle);
    drawLinkLine(ctx,cx,cy,ex,ey,TEAL,10);

    // Black dotted horizontal reference
    ctx.strokeStyle=BLACK; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(cx+12,cy); ctx.lineTo(cx+link2Len+10,cy); ctx.stroke(); ctx.setLineDash([]);

    // Rotation arc
    const arcR=35;
    ctx.strokeStyle=TEAL; ctx.lineWidth=2; ctx.setLineDash([4,3]);
    ctx.beginPath();
    if(angle>=0) ctx.arc(cx,cy,arcR,-angle,0); else ctx.arc(cx,cy,arcR,0,-angle);
    ctx.stroke(); ctx.setLineDash([]);

    // Theta label
    const la=-angle/2;
    ctx.font="bold 9px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=TEAL; ctx.textAlign="center";
    ctx.fillText("θ",cx+(arcR+14)*Math.cos(la),cy+(arcR+14)*Math.sin(la)+4);

    // Joint pin
    ctx.beginPath(); ctx.arc(cx,cy,10,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle=BLACK; ctx.lineWidth=2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,3.5,0,Math.PI*2); ctx.fillStyle=BLACK; ctx.fill();

    // Joint axis text
    ctx.font="12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#e53935"; ctx.textAlign="center";
    ctx.fillText("Joint axis is into the screen",cx,165);

    // Link labels
    const labelsY=269;
    ctx.font="bold 11px 'Playwrite NZ Basic', sans-serif";
    ctx.fillStyle="#475569"; ctx.textAlign="center"; ctx.fillText("Link 1 (fixed)",cx-link1Len/2,labelsY);
    ctx.fillStyle=TEAL; ctx.fillText("Link 2 (rotates)",cx+link2Len/2,labelsY);

    drawRightInfo(ctx,W,"Revolute Joint","Allows rotation about","a single axis.","Think of a door hinge.",undefined,undefined,5,1,["3 translations","2 rotations"]);
  };

  const drawPrismaticJoint = (ctx: CanvasRenderingContext2D,W: number,H: number) => {
    const t=animRef.current;
    const cy=H/2;
    const slideOffset=Math.sin(t*1.0)*60;
    const railX1=40, railX2=320;

    ctx.strokeStyle="#475569"; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(railX1,cy-12); ctx.lineTo(railX2,cy-12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(railX1,cy+12); ctx.lineTo(railX2,cy+12); ctx.stroke();

    ctx.strokeStyle="#94a3b8"; ctx.lineWidth=1;
    for(let i=0;i<15;i++){const tx=railX1+10+i*20; ctx.beginPath(); ctx.moveTo(tx,cy-12); ctx.lineTo(tx,cy+12); ctx.stroke();}

    const blockW=50, blockH=30, blockX=160+slideOffset;
    ctx.fillStyle=TEAL; ctx.globalAlpha=0.85; ctx.fillRect(blockX-blockW/2,cy-blockH/2,blockW,blockH); ctx.globalAlpha=1;
    ctx.strokeStyle=BLACK; ctx.lineWidth=2; ctx.strokeRect(blockX-blockW/2,cy-blockH/2,blockW,blockH);

    const arrowY=cy+45;
    ctx.strokeStyle=TEAL; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(blockX-40,arrowY); ctx.lineTo(blockX+40,arrowY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(blockX-40,arrowY); ctx.lineTo(blockX-34,arrowY-4); ctx.moveTo(blockX-40,arrowY); ctx.lineTo(blockX-34,arrowY+4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(blockX+40,arrowY); ctx.lineTo(blockX+34,arrowY-4); ctx.moveTo(blockX+40,arrowY); ctx.lineTo(blockX+34,arrowY+4); ctx.stroke();
    ctx.font="bold 12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=TEAL; ctx.textAlign="center"; ctx.fillText("d",blockX,arrowY+18);

    const axY=cy-40;
    ctx.strokeStyle="#e53935"; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(railX1+20,axY); ctx.lineTo(railX2-20,axY); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(railX2-20,axY); ctx.lineTo(railX2-26,axY-3); ctx.moveTo(railX2-20,axY); ctx.lineTo(railX2-26,axY+3); ctx.stroke();
    ctx.font="12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#e53935"; ctx.textAlign="center"; ctx.fillText("Sliding axis",(railX1+railX2)/2,axY-10);

    ctx.font="bold 11px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#475569"; ctx.textAlign="center"; ctx.fillText("Rail (fixed)",(railX1+railX2)/2,cy+80);
    ctx.fillStyle=TEAL; ctx.fillText("Slider",blockX,cy-2);

    drawRightInfo(ctx,W,"Prismatic Joint","Allows translation along","a single axis.","Think of a drawer","sliding in and out.",undefined,5,1,["2 translations","3 rotations"]);
  };

  const drawSphericalJoint = (ctx: CanvasRenderingContext2D,W: number,H: number) => {
    const t=animRef.current;
    const cx=190, cy=H/2+10;
    const ballR=28;
    const ang1=Math.sin(t*0.8)*0.4, ang2=Math.cos(t*0.6)*0.3;

    // Socket base
    drawLinkLine(ctx,cx,cy+ballR+40,cx,cy+ballR-2,"#475569",10);
    ctx.strokeStyle="#475569"; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(cx,cy,ballR+4,0.3*Math.PI,0.7*Math.PI); ctx.stroke();

    // Moving link behind ball
    const linkLen=100;
    const ex=cx+linkLen*Math.sin(ang1), ey=cy-linkLen*Math.cos(ang1)+ang2*15;
    drawLinkLine(ctx,cx,cy,ex,ey,TEAL,8);

    // Ball with moving shine
    const shineX=cx-8+ang1*12, shineY=cy-8+ang2*10;
    ctx.beginPath(); ctx.arc(cx,cy,ballR,0,Math.PI*2);
    const grad=ctx.createRadialGradient(shineX,shineY,2,cx,cy,ballR);
    grad.addColorStop(0,"#e0f7fa"); grad.addColorStop(0.35,TEAL); grad.addColorStop(0.8,"#00695c"); grad.addColorStop(1,"#004d40");
    ctx.fillStyle=grad; ctx.fill(); ctx.strokeStyle=BLACK; ctx.lineWidth=2; ctx.stroke();

    // Specular highlight
    ctx.beginPath(); ctx.arc(shineX-2,shineY-2,5,0,Math.PI*2); ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fill();

    // Labels (both centred on cx, static)
    ctx.font="bold 11px 'Playwrite NZ Basic', sans-serif"; ctx.textAlign="center";
    ctx.fillStyle="#475569"; ctx.fillText("Socket (fixed)",cx,cy+ballR+60);
    ctx.fillStyle=TEAL; ctx.fillText("Link (rotates)",cx,cy-linkLen-10);

    drawRightInfo(ctx,W,"Spherical Joint","Allows rotation about","all three axes.","Think of a ball in a socket,","like a human shoulder","(roughly).",3,3,["3 translations"]);
  };

  // ---- ARM DRAWING ----
  const armJoints=[{x:90,y:370},{x:90,y:305},{x:90,y:200},{x:135,y:145},{x:190,y:110},{x:235,y:90}];
  const armTip={x:272,y:78};

  const drawArmLinks = (ctx: CanvasRenderingContext2D) => {
    const pts=[...armJoints,armTip];
    ctx.fillStyle="#aaa"; ctx.strokeStyle=BLACK; ctx.lineWidth=1.5; ctx.fillRect(90-18,370,36,13); ctx.strokeRect(90-18,370,36,13);
    for(let i=0;i<6;i++) drawLinkLine(ctx,pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y,LINK_COLORS[i+1],8);
  };

  const drawArmStage1 = (ctx: CanvasRenderingContext2D,W: number,H: number) => {
    drawGround(ctx,30,H-30,70);
    ctx.font="9px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#999"; ctx.textAlign="center"; ctx.fillText("Ground (fixed)",65,H-38);
    const links=[{x1:150,y1:95,x2:210,y2:55,ci:1},{x1:280,y1:90,x2:350,y2:55,ci:2},{x1:440,y1:95,x2:500,y2:55,ci:3},{x1:150,y1:235,x2:210,y2:195,ci:4},{x1:290,y1:230,x2:345,y2:195,ci:5},{x1:440,y1:235,x2:490,y2:200,ci:6}];
    for(let i=0;i<6;i++){const l=links[i]; drawLinkLine(ctx,l.x1,l.y1,l.x2,l.y2,LINK_COLORS[l.ci],8); const mx=(l.x1+l.x2)/2,my2=(l.y1+l.y2)/2; ctx.font="bold 10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=LINK_COLORS[l.ci]; ctx.textAlign="center"; ctx.fillText("L"+(i+1),mx,my2-14); drawAxes(ctx,l.x1-22,l.y1+5,15);}
    ctx.font="10px 'Playwrite NZ Basic', sans-serif"; ctx.textAlign="center"; ctx.fillStyle="#888";
    ctx.fillText("Each link has 3 translational + 3 rotational = 6 freedoms",W/2,H-65);
    const legY=H-42, legCx=W/2, legStart=legCx-110;
    ctx.strokeStyle="#e53935"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(legStart,legY); ctx.lineTo(legStart+15,legY); ctx.stroke();
    ctx.font="9px 'Playwrite NZ Basic', sans-serif"; ctx.textAlign="left";
    ctx.fillStyle="#e53935"; ctx.fillText("x",legStart+18,legY+4);
    ctx.strokeStyle="#43a047"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(legStart+35,legY); ctx.lineTo(legStart+50,legY); ctx.stroke();
    ctx.fillStyle="#43a047"; ctx.fillText("y",legStart+53,legY+4);
    ctx.strokeStyle="#1e88e5"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(legStart+70,legY); ctx.lineTo(legStart+85,legY); ctx.stroke();
    ctx.fillStyle="#1e88e5"; ctx.fillText("z",legStart+88,legY+4);
    ctx.fillStyle="#888"; ctx.fillText("+ rotation arcs around each",legStart+100,legY+4);
    ctx.font="bold 13px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=ORANGE; ctx.textAlign="center"; ctx.fillText("Total = 6 links × 6 freedoms = 36",W/2,H-14);
  };

  const drawArmStage2 = (ctx: CanvasRenderingContext2D,_W: number,_H: number) => {
    drawGround(ctx,55,383,70); drawArmLinks(ctx);
    ctx.font="9px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#999"; ctx.textAlign="center"; ctx.fillText("Ground",90,396);
    for(let i=0;i<6;i++) drawJointCircle(ctx,armJoints[i].x,armJoints[i].y,true,false,"J"+(i+1));
    const rx=310,ry=90;
    ctx.font="bold 14px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=BLACK; ctx.textAlign="left"; ctx.fillText("All 6 joints frozen solid",rx,ry);
    ctx.font="12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#666";
    const lines=["Each frozen joint removes all m","relative freedoms between the","two links it connects.","","6 joints × 6 removed = 36"];
    lines.forEach((l,i)=>ctx.fillText(l,rx,ry+28+i*22));
    ctx.font="bold 13px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=LOCK_RED; ctx.fillText("m(N - 1 - J) = 6(7 - 1 - 6) = 0",rx,ry+28+lines.length*22+6);
    ctx.font="12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#666"; ctx.fillText("The arm is completely rigid.",rx,ry+28+lines.length*22+34); ctx.fillText("Zero motion possible.",rx,ry+28+lines.length*22+54);
    const ly=ry+28+lines.length*22+95;
    ctx.beginPath(); ctx.arc(rx+7,ly,5,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle=BLACK; ctx.lineWidth=1.5; ctx.stroke();
    ctx.strokeStyle=LOCK_RED; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(rx+4.5,ly-2.5); ctx.lineTo(rx+9.5,ly+2.5); ctx.moveTo(rx+9.5,ly-2.5); ctx.lineTo(rx+4.5,ly+2.5); ctx.stroke();
    ctx.font="10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#888"; ctx.fillText("= frozen (0 freedoms)",rx+20,ly+4);
  };

  const drawArmStage3 = (ctx: CanvasRenderingContext2D,_W: number,_H: number) => {
    drawGround(ctx,55,383,70); drawArmLinks(ctx);
    ctx.font="9px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#999"; ctx.textAlign="center"; ctx.fillText("Ground",90,396);
    for(let i=0;i<6;i++) drawJointCircle(ctx,armJoints[i].x,armJoints[i].y,false,true,"J"+(i+1));
    const rx=310,ry=50;
    ctx.font="bold 14px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=BLACK; ctx.textAlign="left"; ctx.fillText("Joints unlocked",rx,ry);
    ctx.font="12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#666"; ctx.fillText("Each revolute joint allows",rx,ry+26); ctx.fillText("rotation about one axis.",rx,ry+46);
    const ty=ry+78;
    ctx.font="bold 10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=BLACK; ctx.fillText("Joint",rx,ty); ctx.fillText("Type",rx+60,ty); ctx.fillText("fᵢ",rx+165,ty);
    ctx.strokeStyle="#ddd"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(rx,ty+6); ctx.lineTo(rx+185,ty+6); ctx.stroke();
    ctx.font="10px 'Playwrite NZ Basic', sans-serif";
    for(let i=0;i<6;i++){const y=ty+22+i*18; ctx.beginPath(); ctx.arc(rx+4,y-2,3.5,0,Math.PI*2); ctx.fillStyle=LINK_COLORS[i+1]; ctx.fill(); ctx.fillStyle="#555"; ctx.fillText("J"+(i+1),rx+14,y+2); ctx.fillText("Revolute",rx+60,y+2); ctx.font="bold 10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=TEAL; ctx.fillText("1",rx+169,y+2); ctx.font="10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#555";}
    const sy=ty+22+6*18+6;
    ctx.strokeStyle="#ddd"; ctx.beginPath(); ctx.moveTo(rx,sy-6); ctx.lineTo(rx+185,sy-6); ctx.stroke();
    ctx.font="bold 12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=TEAL; ctx.fillText("Σfᵢ = 6",rx+125,sy+8);
    const fy=sy+32;
    ctx.font="bold 13px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=BLACK; ctx.fillText("dof = m(N-1-J) + Σfᵢ",rx,fy); ctx.fillText("dof = 0 + 6",rx,fy+24);
    ctx.fillStyle=GREEN; ctx.fillText("dof = 6",rx,fy+52);
    const ly=fy+78; const t=animRef.current;
    ctx.strokeStyle=TEAL; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(rx+7,ly,5,t*2,t*2+Math.PI*0.7); ctx.stroke();
    ctx.font="10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#888"; ctx.fillText("= free revolute (+1 freedom)",rx+20,ly+4);
  };

  // ---- DOOR DRAWING ----
  const drawDoor = (ctx: CanvasRenderingContext2D,W: number,_H: number) => {
    const t=animRef.current;
    const doorAngle=Math.sin(t*0.8)*0.35+0.4;
    const cx=W/2-40, wallTop=80, wallBot=340;

    ctx.fillStyle="#e0ddd5"; ctx.fillRect(cx-30,wallTop,30,wallBot-wallTop);
    ctx.strokeStyle="#999"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,wallTop); ctx.lineTo(cx,wallBot); ctx.stroke();
    for(let i=0;i<10;i++){const y=wallTop+10+i*((wallBot-wallTop-20)/9); ctx.strokeStyle="#ccc"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-25,y); ctx.lineTo(cx-5,y+15); ctx.stroke();}

    ctx.font="10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#999"; ctx.textAlign="right"; ctx.fillText("Wall (ground)",cx-4,wallTop-12);

    const h1y=150, h2y=280, doorLen=160;
    const doorEndX=cx+doorLen*Math.cos(doorAngle), doorEndY_offset=doorLen*Math.sin(doorAngle)*0.15;

    ctx.fillStyle="#c08040"; ctx.globalAlpha=0.7;
    ctx.beginPath(); ctx.moveTo(cx,h1y); ctx.lineTo(doorEndX,h1y-doorEndY_offset); ctx.lineTo(doorEndX,h2y-doorEndY_offset); ctx.lineTo(cx,h2y); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=1; ctx.strokeStyle="#8B5E3C"; ctx.lineWidth=2; ctx.stroke();

    const doorMx=(cx+doorEndX)/2, doorMy=(h1y+h2y)/2-doorEndY_offset/2;
    ctx.font="bold 12px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#6d3a1a"; ctx.textAlign="center"; ctx.fillText("Door (1 link)",doorMx,doorMy+4);

    const hingeR=7;
    for(const hy of [h1y,h2y]){ctx.beginPath(); ctx.arc(cx,hy,hingeR,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle=BLACK; ctx.lineWidth=2; ctx.stroke(); const ang=t*2+hy*0.01; ctx.strokeStyle=TEAL; ctx.lineWidth=1.8; ctx.beginPath(); ctx.arc(cx,hy,hingeR+5,ang,ang+Math.PI*0.7); ctx.stroke();}

    const labelY1=h1y-35, labelY2=h2y+35, labelX=cx+30;
    ctx.font="bold 11px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle="#666"; ctx.textAlign="left";
    ctx.fillText("Hinge 1 (fᵢ = 1)",labelX,labelY1+4); ctx.fillText("Hinge 2 (fᵢ = 1)",labelX,labelY2+4);
    ctx.strokeStyle="#bbb"; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(cx,h1y-hingeR-2); ctx.lineTo(labelX-4,labelY1+8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,h2y+hingeR+2); ctx.lineTo(labelX-4,labelY2-4); ctx.stroke();

    ctx.strokeStyle=LOCK_RED; ctx.lineWidth=1.5; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(cx,wallTop-5); ctx.lineTo(cx,wallBot+5); ctx.stroke(); ctx.setLineDash([]);
    ctx.font="bold 10px 'Playwrite NZ Basic', sans-serif"; ctx.fillStyle=LOCK_RED; ctx.textAlign="right"; ctx.fillText("Same axis",cx-4,wallBot+22); ctx.fillText("(collinear)",cx-4,wallBot+36);
  };

  const armStageInfo=[
    {title:"Step 1: Make everything free",formula:"m(N - 1) = 6 × 6 = 36"},
    {title:"Step 2: Freeze all joints",formula:"m(N - 1 - J) = 6(0) = 0"},
    {title:"Step 3: Unlock the joints",formula:"dof = 0 + 6 = 6"},
  ];

  const jointInfo: Record<string, {name: string, constraints: number, freedoms: number}> = {revolute:{name:"Revolute Joint",constraints:5,freedoms:1},prismatic:{name:"Prismatic Joint",constraints:5,freedoms:1},spherical:{name:"Spherical Joint",constraints:3,freedoms:3}};

  const BtnStyle=(active: boolean,color: string) => ({padding:"10px 20px",borderRadius:0,border:BORDER,background:active?color:"#fff",color:active?"#fff":BLACK,fontWeight:"bold" as const,fontSize:"12px",fontFamily:"'Playwrite NZ Basic', cursive",cursor:"pointer",boxShadow:SHADOW});
  const press=(e: React.MouseEvent<HTMLButtonElement>)=>e.currentTarget.style.transform="translate(3px,3px)";
  const release=(e: React.MouseEvent<HTMLButtonElement>)=>e.currentTarget.style.transform="translate(0,0)";

  return (
    <>
      <style>{FONTS_CSS}</style>
      <div style={{background:BG,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px",color:BLACK,fontFamily:"'Playwrite NZ Basic', cursive",position:"relative"}}>

        {showInfo && <InfoOverlay onClose={()=>setShowInfo(false)} />}

        <h2 style={{fontFamily:"'Playwrite CU Guides', cursive",color:BLACK,margin:"0 0 2px 0",fontSize:"20px",background:ORANGE,padding:"8px 18px",border:BORDER,boxShadow:SHADOW,display:"inline-block"}}>Grübler's Formula</h2>
        <p style={{fontFamily:"'Playwrite NZ Basic', cursive",color:BLACK,margin:"12px 0 16px 0",fontSize:"14px",background:ORANGE_LIGHT,padding:"5px 14px",border:BORDER,boxShadow:`3px 3px 0px ${BLACK}`}}>dof = m(N - 1 - J) + Σfᵢ</p>

        <div style={{display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>{setExample("joints");setJointType("revolute");}} style={BtnStyle(example==="joints",PURPLE)} onMouseDown={press} onMouseUp={release} onMouseLeave={release}>Joint Types</button>
          <button onClick={()=>{setExample("arm");setStage(1);}} style={BtnStyle(example==="arm",GREEN)} onMouseDown={press} onMouseUp={release} onMouseLeave={release}>6 DoF Arm (works)</button>
          <button onClick={()=>setExample("door")} style={BtnStyle(example==="door",LOCK_RED)} onMouseDown={press} onMouseUp={release} onMouseLeave={release}>Door with 2 hinges (fails)</button>
        </div>

        {example==="joints" && (
          <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
            {(["revolute","prismatic","spherical"] as const).map(jt=>(
              <button key={jt} onClick={()=>setJointType(jt)} style={{padding:"8px 16px",borderRadius:0,border:BORDER,background:jointType===jt?ORANGE:"#fff",color:BLACK,fontWeight:"bold",fontSize:"11px",fontFamily:"'Playwrite NZ Basic', cursive",cursor:"pointer",boxShadow:SHADOW,textTransform:"capitalize"}} onMouseDown={press} onMouseUp={release} onMouseLeave={release}>{jt}</button>
            ))}
          </div>
        )}

        {example==="joints" && (
          <div style={{border:BORDER,background:"#fff",padding:"8px 22px",boxShadow:SHADOW,marginBottom:"10px",textAlign:"center"}}>
            <div style={{fontWeight:"bold",fontSize:"14px"}}>{jointInfo[jointType].name}</div>
            <div style={{fontSize:"13px",marginTop:"4px"}}>
              <span style={{color:LOCK_RED,fontWeight:"bold"}}>Constraints: {jointInfo[jointType].constraints}</span>
              <span style={{margin:"0 10px",color:"#ccc"}}>|</span>
              <span style={{color:GREEN,fontWeight:"bold"}}>Freedoms: {jointInfo[jointType].freedoms}</span>
            </div>
          </div>
        )}

        {example==="arm" && (
          <div style={{display:"flex",gap:"12px",marginBottom:"14px",flexWrap:"wrap",justifyContent:"center"}}>
            {[{label:"m = 6",desc:"3D space"},{label:"N = 7",desc:"6 links + ground"},{label:"J = 6",desc:"revolute joints"},{label:"fᵢ = 1",desc:"per joint"}].map((p,i)=>(
              <div key={i} style={{border:`2px solid ${BLACK}`,background:"#fff",padding:"6px 14px",boxShadow:`3px 3px 0px ${BLACK}`,textAlign:"center",fontSize:"12px"}}>
                <div style={{fontWeight:"bold",fontSize:"14px"}}>{p.label}</div>
                <div style={{color:"#888",fontSize:"10px"}}>{p.desc}</div>
              </div>
            ))}
          </div>
        )}

        {example==="door" && (
          <div style={{display:"flex",gap:"12px",marginBottom:"14px",flexWrap:"wrap",justifyContent:"center"}}>
            {[{label:"m = 6",desc:"3D space"},{label:"N = 2",desc:"door + wall"},{label:"J = 2",desc:"hinge joints"},{label:"fᵢ = 1",desc:"per hinge"}].map((p,i)=>(
              <div key={i} style={{border:`2px solid ${BLACK}`,background:"#fff",padding:"6px 14px",boxShadow:`3px 3px 0px ${BLACK}`,textAlign:"center",fontSize:"12px"}}>
                <div style={{fontWeight:"bold",fontSize:"14px"}}>{p.label}</div>
                <div style={{color:"#888",fontSize:"10px"}}>{p.desc}</div>
              </div>
            ))}
          </div>
        )}

        {example==="arm" && (
          <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
            {[1,2,3].map(s=>(
              <button key={s} onClick={()=>setStage(s)} style={{padding:"10px 20px",borderRadius:0,border:BORDER,background:stage===s?ORANGE:"#fff",color:BLACK,fontWeight:"bold",fontSize:"12px",fontFamily:"'Playwrite NZ Basic', cursive",cursor:"pointer",boxShadow:SHADOW}} onMouseDown={press} onMouseUp={release} onMouseLeave={release}>STEP {s}</button>
            ))}
          </div>
        )}

        {example==="arm" && (
          <div style={{border:BORDER,background:"#fff",padding:"8px 22px",boxShadow:SHADOW,marginBottom:"10px",textAlign:"center"}}>
            <div style={{fontWeight:"bold",fontSize:"14px"}}>{armStageInfo[stage-1].title}</div>
            <div style={{fontSize:"16px",fontWeight:"bold",color:stage===3?GREEN:stage===2?LOCK_RED:ORANGE,marginTop:"4px"}}>{armStageInfo[stage-1].formula}</div>
          </div>
        )}

        {example==="door" && (
          <div style={{border:BORDER,background:"#fff",padding:"8px 22px",boxShadow:SHADOW,marginBottom:"10px",textAlign:"center"}}>
            <div style={{fontWeight:"bold",fontSize:"14px"}}>Formula gives -4, reality is 1 DoF</div>
            <div style={{fontSize:"13px",color:LOCK_RED,marginTop:"4px",fontWeight:"bold"}}>Redundant constraints break the formula</div>
          </div>
        )}

        <div style={{position:"relative",display:"inline-block"}}>
          <canvas ref={canvasRef} width={620} height={420} style={{borderRadius:0,border:BORDER,boxShadow:SHADOW,background:"#fffbf0",display:"block"}} />
          <button onClick={()=>setShowInfo(true)} style={{position:"absolute",top:10,left:10,width:30,height:30,border:`2px solid ${BLACK}`,background:"#fff",color:BLACK,fontWeight:"bold",fontSize:"16px",fontFamily:"Georgia, serif",fontStyle:"italic",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`2px 2px 0px ${BLACK}`,borderRadius:0,padding:0}} onMouseDown={e=>e.currentTarget.style.transform="translate(2px,2px)"} onMouseUp={release} onMouseLeave={release}>i</button>
        </div>

        <div style={{marginTop:"16px",background:"#fff",padding:"14px 22px",maxWidth:"620px",fontSize:"12px",lineHeight:"1.7",border:BORDER,boxShadow:SHADOW,width:"100%",boxSizing:"border-box"}}>
          {example==="joints" && jointType==="revolute" && (<>
            <p style={{margin:"0 0 6px 0"}}><strong>Revolute joint</strong> (1 DoF): Allows rotation about a single axis. Think of a door hinge.</p>
            <p style={{margin:"0 0 6px 0"}}>It places 5 constraints on the motion of one link relative to another (blocks 3 translations and 2 rotations), leaving only 1 rotational freedom.</p>
            <p style={{margin:"0"}}>This is the most common joint in robotics. For any joint: <strong>constraints + freedoms = 6</strong> in spatial mechanisms.</p>
          </>)}
          {example==="joints" && jointType==="prismatic" && (<>
            <p style={{margin:"0 0 6px 0"}}><strong>Prismatic joint</strong> (1 DoF): Allows translation along a single axis. Think of a drawer sliding in and out.</p>
            <p style={{margin:"0 0 6px 0"}}>It places 5 constraints (blocks 2 translations and 3 rotations), leaving 1 translational freedom.</p>
            <p style={{margin:"0"}}>Like a revolute joint, it has 1 freedom, but that freedom is translational rather than rotational.</p>
          </>)}
          {example==="joints" && jointType==="spherical" && (<>
            <p style={{margin:"0 0 6px 0"}}><strong>Spherical joint</strong> (3 DoF): Allows rotation about all three axes. Think of a ball in a socket, like a human shoulder (roughly).</p>
            <p style={{margin:"0 0 6px 0"}}>It places 3 constraints (blocks all translation), leaving 3 rotational freedoms.</p>
            <p style={{margin:"0"}}>The three rotation arcs show the roll, pitch, and yaw axes the joint allows.</p>
          </>)}
          {example==="arm" && stage===1 && (<>
            <p style={{margin:"0 0 6px 0"}}>Disconnect all links from each other. N - 1 = 6 links float freely (we exclude the ground link).</p>
            <p style={{margin:"0 0 6px 0"}}>Each free link in 3D has <strong>m = 6 freedoms</strong>: 3 translational (x, y, z) and 3 rotational (roll, pitch, yaw), shown by the coordinate axes.</p>
            <p style={{margin:"0"}}>Total freedoms = <strong>m(N - 1) = 6 × 6 = 36</strong>.</p>
          </>)}
          {example==="arm" && stage===2 && (<>
            <p style={{margin:"0 0 6px 0"}}>Reconnect the links with joints, but pretend every joint is <span style={{color:LOCK_RED,fontWeight:"bold"}}>completely frozen and allows no motion</span>.</p>
            <p style={{margin:"0 0 6px 0"}}>Each frozen joint connects two links and removes all m relative freedoms between them. 6 joints remove 6 × 6 = 36 freedoms.</p>
            <p style={{margin:"0"}}>Remaining = 36 - 36 = <strong style={{color:LOCK_RED}}>0</strong>. The entire arm is one rigid structure. No motion possible.</p>
          </>)}
          {example==="arm" && stage===3 && (<>
            <p style={{margin:"0 0 6px 0"}}>Each revolute joint is <span style={{color:TEAL,fontWeight:"bold"}}>unlocked</span>. Each joint i actually allows fᵢ freedoms. For revolute joints, that is 1 freedom per joint.</p>
            <p style={{margin:"0 0 6px 0"}}>6 revolute joints add back 1 + 1 + 1 + 1 + 1 + 1 = 6 freedoms.</p>
            <p style={{margin:"0"}}>dof = 0 + 6 = <strong style={{color:GREEN}}>6</strong>. The arm has 6 degrees of freedom.</p>
          </>)}
          {example==="door" && (<>
            <p style={{margin:"0 0 8px 0"}}><strong>dof = 6(2 - 1 - 2) + (1 + 1) = 6(-1) + 2 = <span style={{color:LOCK_RED}}>-4</span></strong></p>
            <p style={{margin:"0 0 8px 0"}}><strong style={{color:GREEN}}>Reality: dof = 1.</strong> The door clearly swings open and shut on a single axis.</p>
            <p style={{margin:"0 0 6px 0"}}>The formula fails because both hinge axes are <strong>collinear</strong> (they lie on the same vertical line). This makes their constraints redundant, not independent. The second hinge removes no freedom that the first hasn't already removed.</p>
            <p style={{margin:"0"}}>The formula is purely topological. It counts links and joints but knows nothing about the actual geometry of the mechanism. When geometry creates redundant constraints, the formula double counts that removal and underestimates the actual DoF.</p>
          </>)}
        </div>
      </div>
    </>
  );
}
