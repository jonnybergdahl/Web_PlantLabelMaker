import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stage } from '@react-three/drei';
import { Download, Leaf, Sun, Moon } from 'lucide-react';
import { createLabelModel } from './utils/labelGenerator';
import { exportTo3MF } from './utils/export3mf';
import { exportToSTL } from './utils/exportStl';
import './App.css';

function Preview({ meshes }) {
  if (!meshes) return null;

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <axesHelper args={[20]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[100, 100, 100]} intensity={1} />
      <primitive object={meshes.bodyMesh} />
      <primitive object={meshes.textGroup} />
    </group>
  );
}

function App() {
  const [plantName, setPlantName] = useState('Monstera');
  const [latinName, setLatinName] = useState('Monstera Deliciosa');
  const [labelWidth, setLabelWidth] = useState(15);
  const [labelLength, setLabelLength] = useState(150);
  const [labelThickness, setLabelThickness] = useState(1.6);
  const [font, setFont] = useState('fonts/roboto_bold.json');
  const [meshes, setMeshes] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    createLabelModel(plantName, latinName, labelWidth, labelLength, labelThickness, font)
      .then(setMeshes)
      .catch(console.error);
  }, [plantName, latinName, labelWidth, labelLength, labelThickness, font]);

  const handleDownload = async () => {
    if (meshes) {
      await exportTo3MF(meshes.bodyMesh, meshes.textGroup, `${plantName.replace(/\s+/g, '_')}_label.3mf`);
    }
  };

  const handleDownloadSTL = async () => {
    if (meshes) {
      await exportToSTL(meshes.bodyMesh, meshes.textGroup, `${plantName.replace(/\s+/g, '_')}_label.stl`);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const canvasBg = theme === 'dark' ? '#2d2d2d' : '#ffffff';

  return (
    <div className="app-container">
      <header>
        <h1><Leaf size={32} /> Plant Label Maker</h1>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <main>
        <div className="controls">
          <div className="input-group">
            <label htmlFor="plantName">Plant Name</label>
            <input
              id="plantName"
              type="text"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="e.g. Monstera"
            />
          </div>
          <div className="input-group">
            <label htmlFor="latinName">Latin Name</label>
            <input
              id="latinName"
              type="text"
              value={latinName}
              onChange={(e) => setLatinName(e.target.value)}
              placeholder="e.g. Monstera deliciosa"
            />
          </div>
          <div className="input-group">
            <label htmlFor="font">Font</label>
            <select
              id="font"
              value={font}
              onChange={(e) => setFont(e.target.value)}
            >
              <option value="fonts/roboto_bold.json">Roboto Bold</option>
              <option value="fonts/montserrat_bold.json">Montserrat Bold</option>
              <option value="fonts/open_sans_bold.json">Open Sans Bold</option>
              <option value="fonts/bebas_neue_regular.json">Bebas Neue</option>
              <option value="fonts/ubuntu_bold.json">Ubuntu Bold</option>
            </select>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="labelWidth">Width (mm)</label>
              <input
                id="labelWidth"
                type="number"
                value={labelWidth}
                onChange={(e) => setLabelWidth(Number(e.target.value))}
                min="10"
                max="50"
              />
            </div>
            <div className="input-group">
              <label htmlFor="labelLength">Length (mm)</label>
              <input
                id="labelLength"
                type="number"
                value={labelLength}
                onChange={(e) => setLabelLength(Number(e.target.value))}
                min="50"
                max="300"
              />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="labelThickness">Thickness (mm)</label>
              <input
                id="labelThickness"
                type="number"
                value={labelThickness}
                step="0.1"
                onChange={(e) => setLabelThickness(Number(e.target.value))}
                min="1"
                max="5"
              />
            </div>
          </div>
          <p className="spec-info">{labelLength}x{labelWidth}x{labelThickness} mm Label • 1.0 mm Text • 0.8 mm Inset</p>
          <div className="button-row">
            <button className="download-button" onClick={handleDownload}>
              <Download size={20} /> Download 3MF
            </button>
          </div>
          <div className="button-row">
            <button className="download-button secondary" onClick={handleDownloadSTL}>
              <Download size={20} /> Download STL
            </button>
          </div>
        </div>

        <div className="preview-container">
          <Canvas shadows camera={{ position: [110, labelLength / 2, 165], fov: 45 }}>
            <color attach="background" args={[canvasBg]} />
            <Preview meshes={meshes} />
            <OrbitControls makeDefault target={[0, labelLength / 2, 0]} />
          </Canvas>
        </div>
      </main>

      <footer>
        <p>
          © 2024 <a href="https://github.com/jonnybergdahl/Web_PlantLabelMaker" target="_blank" rel="noopener noreferrer">Jonny Bergdahl</a> • 
          MIT License • 
          <a href="https://github.com/jonnybergdahl/Web_PlantLabelMaker" target="_blank" rel="noopener noreferrer">GitHub Project</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
