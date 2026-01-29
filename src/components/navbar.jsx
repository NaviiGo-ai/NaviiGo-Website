import React, { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TuneIcon from '@mui/icons-material/Tune';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

function Navbar() {
  const [themeMode, setThemeMode] = useState('system');

  const theme = createTheme({
    palette: {
      mode: themeMode === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : themeMode,
    },
  });

  const handleThemeChange = () => {
    setThemeMode((prevMode) => {
      if (prevMode === 'light') return 'dark';
      if (prevMode === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Poppins',
          margin: '1vh 2vw 1vh 2vw'
        }}
      >
        <h2>Naviigo</h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '2vw',
            fontSize: '1.5rem',
            fontWeight: '600',
          }}
        >
          <h2>Profile</h2>
          <h2>About Us</h2>
          <h2>Explore</h2>
          <IconButton onClick={handleThemeChange} color="inherit">
            {themeMode === 'light' && <WbSunnyIcon />}
            {themeMode === 'dark' && <NightsStayIcon />}
            {themeMode === 'system' && <TuneIcon />}
          </IconButton>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default Navbar;
