import boxplotImage from './images/boxplot.svg';
import chernoffImage from './images/chernoff.svg';
import correlationMatrixImage from './images/correlationmatrix.svg';
import parallelcoordImage from './images/parallelcoordinates.svg';
import PCAImage from './images/pca.svg';
import radialImage from './images/radial.svg';
import radvizImage from './images/radviz.svg';
import splomImage from './images/scatterplotmatrix.svg';
import somImage from './images/som.svg';
import starCoordImage from './images/starcoordinates.svg';
import stripPlotImage from './images/stripplot.svg';
import UMAPImage from './images/umap.svg';
import volinChartImage from './images/violin.svg';

export const techniques = [  
    {
      bitcode: [1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,1,0,1,0,0,1,0],
      id: "BOXGRAPH",
      image: boxplotImage,
      name: "Box graph",
      similarity:1
    },
    {
      bitcode: [1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
      id: "CHERNOFF",
      image: chernoffImage,
      name: "Chernoff Faces",
      similarity:1
    },
    {
      bitcode: [1,1,0,0,0,0,0,1,0,0,0,0,1,1,1,1,0,0,0,1,0,0,0],
      id: "CORRELATIONMATRIX",
      image: correlationMatrixImage,
      name: "Correlation Matrix",
      similarity:1
    },
    {
      bitcode: [1,0,1,0,1,0,0,0,1,0,0,1,1,0,0,1,1,1,0,1,1,1,0], 
      id: "PARALLELCOORD", 
      image: parallelcoordImage, 
      name: "Parallel coordinates", 
      similarity: 1
    },
    {
      bitcode: [0,0,1,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,], 
      id: "PCA", 
      image: PCAImage, 
      name: "PCA", 
      similarity: 1
    },
    {
      bitcode: [1,0,1,0,0,1,0,0,1,0,0,1,1,0,0,1,1,1,0,1,1,1,0], 
      id: "RADIALCOORD", 
      image: radialImage, 
      name: "Radial coordinates", 
      similarity: 1
    },
    {
      bitcode: [1,0,1,0,0,1,0,1,0,0,0,1,1,0,0,0,1,0,0,1,0,1,0], 
      id: "RADVIZ", 
      image: radvizImage, 
      name: "RadViz", 
      similarity: 1
    },
    {
      bitcode: [1,0,1,1,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,1,0,1,0], 
      id: "SPLOM", 
      image: splomImage, 
      name: "SPLOM", 
      similarity: 1
    },
    {
      bitcode: [0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0], 
      id: "SOM", 
      image: somImage, 
      name: "SOM", 
      similarity: 1
    },
    {
      bitcode: [1,0,1,0,0,1,0,1,0,0,0,1,1,0,0,0,1,0,0,1,0,1,0], 
      id: "STARCOORD", 
      image: starCoordImage, 
      name: "Star Coordinates", 
      similarity: 1
    },
    {
      bitcode: [1,1,1,1,0,0,0,1,0,0,0,1,1,0,0,0,1,0,1,0,0,1,0], 
      id: "STRIPPLOT", 
      image: stripPlotImage, 
      name: "Strip plot", 
      similarity: 1
    },
    {
      bitcode: [0,0,1,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0], 
      id: "UMAP", 
      image: UMAPImage, 
      name: "UMAP", 
      similarity: 1
    },
    {
      bitcode: [1,1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,1,0,1,0,0,1,0], 
      id: "VIOLINCHART", 
      image: volinChartImage, 
      name: "Violin chart", 
      similarity: 1
    }
]
