import { Link } from 'react-router-dom'

const BLACK = "#1a1a1a"
const BG = "#f5f0e8"
const ORANGE = "#ff6d00"
const BORDER = `3px solid ${BLACK}`
const SHADOW = `5px 5px 0px ${BLACK}`

const topics = [
  {
    title: "Grübler's Formula",
    description: "Degrees of freedom of a mechanism. Joint types, the 3-step intuition, and when the formula breaks.",
    path: "/grublers-formula",
  },
]

export default function Home() {
  return (
    <div style={{background:BG,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 24px",color:BLACK,fontFamily:"'Playwrite NZ Basic', cursive"}}>
      <h1 style={{fontFamily:"'Playwrite CU Guides', cursive",fontSize:"24px",margin:"0 0 8px 0",background:ORANGE,padding:"10px 22px",border:BORDER,boxShadow:SHADOW,display:"inline-block"}}>Robotics Visual Notes</h1>
      <p style={{fontSize:"14px",color:"#666",margin:"16px 0 32px 0",textAlign:"center",maxWidth:"460px",lineHeight:"1.7"}}>Interactive visual explanations of robotics fundamentals.</p>
      <div style={{display:"flex",flexDirection:"column",gap:"16px",width:"100%",maxWidth:"500px"}}>
        {topics.map(t => (
          <Link key={t.path} to={t.path} style={{textDecoration:"none",color:BLACK}}>
            <div style={{background:"#fff",border:BORDER,boxShadow:SHADOW,padding:"18px 22px",cursor:"pointer",transition:"transform 0.1s"}} onMouseDown={e=>e.currentTarget.style.transform="translate(3px,3px)"} onMouseUp={e=>e.currentTarget.style.transform=""} onMouseLeave={e=>e.currentTarget.style.transform=""}>
              <div style={{fontWeight:"bold",fontSize:"16px",marginBottom:"6px"}}>{t.title}</div>
              <div style={{fontSize:"12px",color:"#666",lineHeight:"1.6"}}>{t.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
