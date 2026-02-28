import { Link } from 'react-router-dom'
import { FONTS_CSS, BG, BLACK, ORANGE, BORDER, SHADOW, HEADING_FONT, BODY_FONT } from './styles'

const topics = [
  {
    title: "Grübler's Formula",
    description: "Degrees of freedom of a mechanism. Joint types, the 3-step intuition, and when the formula breaks.",
    path: "/grublers-formula",
  },
]

export default function Home() {
  return (
    <>
      <style>{FONTS_CSS}</style>
      <div style={{background:BG,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 24px",color:BLACK,fontFamily:BODY_FONT}}>
        <h1 style={{fontFamily:HEADING_FONT,fontSize:"28px",margin:"0 0 8px 0",background:ORANGE,padding:"10px 22px",border:BORDER,boxShadow:SHADOW,display:"inline-block"}}>Robotics Visual Notes</h1>
        <p style={{fontSize:"16px",color:"#666",margin:"20px 0 40px 0",textAlign:"center",maxWidth:"540px",lineHeight:"1.7"}}>Interactive visual explanations of robotics fundamentals.</p>
        <div style={{display:"flex",flexDirection:"column",gap:"20px",width:"100%",maxWidth:"600px"}}>
          {topics.map(t => (
            <Link key={t.path} to={t.path} style={{textDecoration:"none",color:BLACK}}>
              <div style={{background:"#fff",border:BORDER,boxShadow:SHADOW,padding:"22px 28px",cursor:"pointer",transition:"transform 0.1s"}} onMouseDown={e=>e.currentTarget.style.transform="translate(3px,3px)"} onMouseUp={e=>e.currentTarget.style.transform=""} onMouseLeave={e=>e.currentTarget.style.transform=""}>
                <div style={{fontWeight:"bold",fontSize:"20px",marginBottom:"8px"}}>{t.title}</div>
                <div style={{fontSize:"14px",color:"#666",lineHeight:"1.7"}}>{t.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
