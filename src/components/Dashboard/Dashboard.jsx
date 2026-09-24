import { useContext, useEffect, useState } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import './DashboardStyles.css';
import GridLayout from 'react-grid-layout';
import Card from 'react-bootstrap/Card';
import { MdDragIndicator } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { IoResize } from "react-icons/io5";

import CorrelationMatrixTechnique from '../Techniques/CorrelationMatrixTechnique.jsx';
import SPLOMTechnique from '../Techniques/SPLOMTechnique.jsx';
import ChernoffFacesTechnique from '../Techniques/ChernoffFacesTechnique.jsx';
import BoxgraphTechnique from '../Techniques/BoxgraphTechnique.jsx';
import ParallelCoordinatesTechnique from '../Techniques/ParallelCoordinatesTechnique.jsx';
import RadialCoordinatesTechnique from '../Techniques/RadialCoordinatesTechnique.jsx';
import UMAPTechnique from '../Techniques/UMAPTechnique.jsx';
import RadvizTechnique from '../Techniques/RadvizTechnique.jsx';
import ViolingraphTechnique from '../Techniques/ViolingraphTechnique.jsx';
import StarCoordinatesTechnique from '../Techniques/StarCoordinatesTechnique.jsx';
import PCATechnique from '../Techniques/PCATechnique.jsx';
import StripplotTechnique from '../Techniques/StripplotTechnique.jsx';
import SOMTechnique from '../Techniques/SOMTechnique.jsx';

// Load the full build.
import _ from 'lodash';


export default function Dashboard({ selectedTechnique, userConfigArray}) {
  
  const {data, identifiersList, selectedCategory} = useContext(DataContext);
  
  const [cols, setCols] = useState(12);
  const [w, setW] = useState(3);
  const [newCounter, setNewCounter] = useState(0);
  const [layout, setLayout] = useState([]);
  const [flag, setFlag] = useState(false);
  const [items, setItems] = useState([]);
  
  useEffect(() => {

    if(selectedTechnique!=null){
      switch (selectedTechnique.id) {
        case 'BOXGRAPH':
        case 'RADVIZ':
        case 'STARCOORD':
        case 'PCA':
        case 'STRIPPLOT':
        case 'SOM':
        case 'VIOLINCHART':
        case 'CORRELATIONMATRIX':
        case 'UMAP':
          setLayout(layout.concat({
            i: "n" + newCounter,
            x: (layout.length * 3) % (cols || 12),
            y: Infinity,
            w: selectedCategory != null
              ? (screen.width > 1900 ? w + 2 : w + 3)
              : (screen.width > 1900 ? w + 1 : w + 2),
            //minW: 3,
            h: 3,
            //minH: 3,
          }));
          break;
        case 'SPLOM':
          setLayout(layout.concat({
            i: "n" + newCounter,
            x: (layout.length * 3) % (cols || 12),
            y: Infinity,
            w: selectedCategory != null
              ? (screen.width > 1900 ? w + 2 : w + 3)
              : (screen.width > 1900 ? w + 1 : w + 2),
            minW: 3,
            h: 3,
            minH: 3,
          }));
          break;
        case 'CHERNOFF':
        case 'RADIALCOORD':
          setLayout(layout.concat({
            i: "n" + newCounter,
            x: (layout.length * 3) % (cols || 12),
            y: Infinity,
            w: selectedCategory != null
              ? (screen.width > 1900 ? w + 2 : w + 3)
              : (screen.width > 1900 ? w + 1 : w + 2),
            minW: 5,
            h: 3,
            minH: 3,
          }));
          break;
        case 'PARALLELCOORD':
          setLayout(layout.concat({
            i: "n" + newCounter,
            x: (layout.length * 3) % (cols || 12),
            y: Infinity,
            w: selectedCategory != null ? w * 2 + 1 : w * 2,
            h: 3,
            minW: w * 2,
          }));
          break;
        default:
          setLayout(layout.concat({
            i: "n" + newCounter,
            x: (layout.length * 3) % (cols || 12),
            y: Infinity,
            w: selectedCategory != null ? 4 : 3,
            h: 2,
            minW: 3,
          }));
          break;
      }

      setItems(items.concat({i:"n" + newCounter, type:selectedTechnique.id}));
      setNewCounter(newCounter + 1);
    }
  }, [selectedTechnique]);

  useEffect(() =>{
    setLayout([]);
    setNewCounter(0);
  }, [data]);


  function createElement(el) {
    const removeStyle = {
      position: "absolute",
      width: "15px",
      marginRight: 0,
      height: "15px",
      right: "5px",
      top: "5px",
      cursor: "pointer",
      color: "#566573",
      fontWeight: 800,
    };

    const dragStyle = {
      position: "absolute",
      width: "15px",
      marginRight: 0,
      height: "15px",
      right: "30px",
      top: "5px",
      cursor: "grab",
      color: "#566573",
      fontWeight: 800,
    };

    const resizeStyle = {
      position: "absolute",
      width: "15px",
      marginRight: 0,
      height: "15px",
      right: "5px",
      bottom: "5px",
      color: "#566573",
      fontWeight: 800,
      transform: 'rotate(90deg)',
    };
    const i = el.i;
    const item = items.find(item => item.i == i);
    
    switch (item.type) {
      case 'CORRELATIONMATRIX':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
              <CorrelationMatrixTechnique id={"i" + i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
              <MdDragIndicator className="drag-handle" style={dragStyle} />
              <IoMdClose className="remove" style={removeStyle} onClick={() => onRemoveItem(i)} />
              <IoResize className="remove" style={resizeStyle} />
            </Card.Body>
          </Card>
        );
      case 'SPLOM':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
              <SPLOMTechnique id={"i" + i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
              <MdDragIndicator className="drag-handle" style={dragStyle} />
              <IoMdClose className="remove" style={removeStyle} onClick={() => onRemoveItem(i)} />
              <IoResize className="remove" style={resizeStyle} />
            </Card.Body>
          </Card>
        );
      case 'CHERNOFF':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <ChernoffFacesTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'BOXGRAPH':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <BoxgraphTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'PARALLELCOORD':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <ParallelCoordinatesTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'RADIALCOORD':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <RadialCoordinatesTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'UMAP':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <UMAPTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'RADVIZ':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <RadvizTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'VIOLINCHART':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <ViolingraphTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'STARCOORD': 
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <StarCoordinatesTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'PCA': 
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <PCATechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'STRIPPLOT':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <StripplotTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      case 'SOM':
        return (
          <Card key={i} id={i} data-grid={el}>
            <Card.Body>
            <SOMTechnique id={"i"+i} iddiv={i} userConfigArray={userConfigArray} flag={flag}/>
            <MdDragIndicator className="drag-handle" style={dragStyle}/>
            <IoMdClose className="remove" style={removeStyle} onClick={()=>onRemoveItem(i)}/>
            <IoResize className="remove" style={resizeStyle}/>
            </Card.Body>
          </Card>
        );
      default:
        return (
          <h1 key={i}>Hola</h1>
        );
    }
    
  }

  function onRemoveItem(i) {
    setLayout(_.reject(layout, { i: i }) );
  }

  function onLayoutChange(newLayout) {
    //this.props.onLayoutChange(layout);
    setLayout(newLayout);
  }
  
  function onResizeStop(newLayout, newItem) {
    setFlag(!flag);
    setLayout(newLayout);
  }

  return (
    
    <GridLayout  className="layout" layout={[]} cols={cols} rowHeight={200} width={screen.width-50}
      draggableHandle=".drag-handle"
      draggableCancel='.dashboard-item-content'
      onResizeStop={onResizeStop}>
       {_.map(layout, el => createElement(el))}
    </GridLayout >
  );
}
