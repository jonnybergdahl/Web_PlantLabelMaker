# Plant Label Maker

A web-based 3D generator for creating custom, multi-material plant labels. This application allows you to design a 150mm x 15mm (default) plant stake with inset, extruded text for both the common Plant Name and the Latin Name, optimized for 3D printing.

## Features

- **Real-time 3D Preview**: Visualize your label as you adjust the text and dimensions.
- **Customizable Dimensions**: Adjust the width, length (height), and thickness of the label.
- **Font Selection**: Choose from multiple bold fonts (Roboto, Montserrat, Open Sans, Bebas Neue, Ubuntu) for the label text.
- **Dynamic Text Scaling**: Automatically fits the Plant Name and Latin Name within the label's width.
- **Multi-Material 3MF Export**: Generates a 3MF file with separate objects for the label body (gray) and text (white), perfect for multi-color 3D printers.
- **60-Degree Pointed Tip**: Designed for easy insertion into soil.
- **Rounded Corners**: 3mm radius fillets on the top corners for a professional finish.
- **Dark/Light Mode Support**: Automatically follows system settings with a manual toggle.
- **Clean 3D Geometry**: Optimized meshes with merged vertices and correct normals to ensure manifold files for slicing.

## Specifications

- **Default Dimensions**: 150mm (L) x 15mm (W) x 1.6mm (T).
- **Text Geometry**: 1.0mm thick, submerged 0.8mm into the label (0.2mm protrusion).
- **Materials**: 3MF export uses separate objects for body and text.
- **Fonts**: Roboto Bold (Default), Montserrat, Open Sans, Bebas Neue, Ubuntu.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jonnybergdahl/Web_PlantLabelMaker.git
   cd Web_PlantLabelMaker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Building for Production

To create a production build:
```bash
npm run build
```

## Technologies Used

- **React**: Frontend framework.
- **Three.js / @react-three/fiber**: 3D rendering and geometry generation.
- **Vite**: Build tool and development server.
- **JSZip**: Packaging the 3MF file structure.
- **Lucide React**: UI icons.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Created by [Jonny Bergdahl](https://github.com/jonnybergdahl).
