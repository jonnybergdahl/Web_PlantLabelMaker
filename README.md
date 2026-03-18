# Plant Label Maker

A web-based 3D generator for creating custom, multi-material plant labels. This application allows you to design a 150mm x 15mm (default) plant stake with inset, extruded text for both the common Plant Name and the Latin Name, optimized for 3D printing.

**Live Demo: [https://jonnybergdahl.github.io/Web_PlantLabelMaker/](https://jonnybergdahl.github.io/Web_PlantLabelMaker/)**

## Features

- **Real-time 3D Preview**: Visualize your label as you adjust the text and dimensions.
- **Customizable Dimensions**: Adjust the width, length, and thickness of the label.
- **Font Selection**: Choose from multiple fonts for the label text.
- **Emboss/Inset Modes**: Toggle between insetting text (0.8mm deep) and embossing (0.2mm on the surface) for both single and multi extruder 3D printing.
- **Multi-Material 3MF Export**: Generates a 3MF file with separate objects for the label body and text (white).
- **Dual-File STL Export (ZIP)**: Exports both body and text as separate STL files in a single ZIP archive.
- **Dark/Light Mode Support**: Automatically follows system settings with a manual toggle.

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

Created by [Jonny Bergdahl](https://github.com/jonnybergdahl). Code is written with the help of Jetbrains Junie.
