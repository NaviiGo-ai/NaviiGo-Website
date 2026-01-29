function Navbar() {

  return (
    <>
    <div
    style={{display: "flex", justifyContent: "space-between", fontFamily: "Poppins", 
      margin: "1vh 2vw 1vh 2vw"}}
    >
      <h2>Naviigo</h2>
      <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "2vw"
      }}
      >
        
        <h2>Profile</h2>
        <h2>About Us</h2>
        <h2>Mode</h2>
        <h2>Explore</h2>
      </div>
    </div>  
    </>
  )
}

export default Navbar
