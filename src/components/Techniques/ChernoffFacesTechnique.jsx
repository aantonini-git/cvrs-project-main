import { useEffect, useState, useContext, useRef } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import './Styles/ChernoffFacesStyles.css';
import * as d3 from "d3";
import { configuration_options } from "../ConfigureTechniques/configuration.js";


export default function ChernoffFacesTechnique({ id, iddiv, userConfigArray, flag }) {
 
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

  const [xOptions, setxOption] = useState([]);
  const [yOptions, setyOption] = useState([]);
  const [selectedOption, setSelectedOption] = useState([-1,-1]); 
  const [elementX, setElementX] = useState("elementX"); 
  const [elementY, setElementY] = useState("elementY"); 
  const [axesType, setAxesType] = useState("Unstructured"); 
  const svgRef = useRef(null);

  useEffect(() => {
    let dropOptionsX = [];
    for(let i = 0; i<identifiersList.length; i++){
      dropOptionsX.push(<Dropdown.Item id={"optx" + i} key={"optx" + i} eventKey={"optx" + i}> {identifiersList[i]}</Dropdown.Item>);
    }

    let dropOptionsY = [];
    for(let i = 0; i<identifiersList.length; i++){
      dropOptionsY.push(<Dropdown.Item id={"opty" + i} key={"opty" + i} eventKey={"opty" + i}> {identifiersList[i]}</Dropdown.Item>);
    }
    setxOption(dropOptionsX);
    setyOption(dropOptionsY);

    const idUnstructured = configuration_options.find(opt => opt.label === "Unstructured")?.bit;
    const idQuantitative = configuration_options.find(opt => opt.label === "Quantitative")?.bit;
    
    if (userConfigArray[idUnstructured]==1 && userConfigArray[idQuantitative]==0) { 
      setAxesType('Unstructured');
    } 
    else {
      setAxesType('Quantitative');
    }
  }, [userConfigArray]);
  
  useEffect(() => {
    if (!svgRef.current) return;

    if (axesType === 'Unstructured')
      drawChartUnstructured();
    else
      drawChart();

  }, [axesType, selectedOption, data, flag]);

  useEffect(() => {
    updateSelectedData();
  }, [selectedIds, selectedCategory]);

  

  function updateSelectedData() { 

    var svg = d3.select("#" + id);

    svg.selectAll(".faces")
      .style("opacity", function() {
          
        const i = +d3.select(this).attr("data-index");

        return selectedIds.includes(i)||selectedIds.length==0 ? 1 : 0.2;
      });
  }

  function drawChartUnstructured(){

    d3.select("#" + id).selectAll("*").remove();

    // Definir dimensiones (se agranda el margen derecho para la leyenda)
    var margin = {
      top: 20,
      right: selectedCategory != null ? 120 : 50,
      bottom: 50,
      left: 20
    },
    width = document.getElementById(''+iddiv).offsetWidth == 0? 550 : document.getElementById(''+iddiv).offsetWidth - margin.right - margin.left,
    height = document.getElementById(''+iddiv).offsetHeight == 0? 550 :  document.getElementById(''+iddiv).offsetHeight - margin.bottom - margin.top;
    
    // Crear el SVG y agregar el grupo de gráficos con márgenes
    var svg = d3.select("#" + id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    function drawChernoffFace(svg, data, x, y, colorFace, opacity) {
      const face = svg.append("g")
      .attr("transform", `translate(${x}, ${y})`)
      .classed("faces", true);

      const faceRadius = 10;
      // Draw ears
      face.append("circle")
      .attr("cx", -faceRadius - data.earSize / 2)
      .attr("cy", 0)
      .attr("r", data.earSize*3)
      .style("fill", colorFace)
      .style("fill-opacity", opacity)
      .style("stroke", "black");

      face.append("circle")
      .attr("cx", faceRadius + data.earSize*3 / 2)
      .attr("cy", 0)
      .attr("r", data.earSize*3)
      .style("fill", colorFace)
      .style("fill-opacity", opacity)
      .style("stroke", "black");

      // Draw face
      face.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", faceRadius)
      .style("fill", colorFace)
      .style("fill-opacity", opacity)
      .style("stroke", "black");

      // Draw eyes with pupils
      face.append("circle")
      .attr("cx", -faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize*3)
      .style("fill", "white")
      .style("stroke", "black");

      face.append("circle")
      .attr("cx", -faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize * data.pupilSize *3)
      .style("fill", "black");

      face.append("circle")
      .attr("cx", faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize*3)
      .style("fill", "white")
      .style("stroke", "black");

      face.append("circle")
      .attr("cx", faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize * data.pupilSize *3)
      .style("fill", "black");

      // Draw nose
      face.append("line")
      .attr("x1", 0)
      .attr("y1", -faceRadius / 6)
      .attr("x2", 0)
      .attr("y2", faceRadius / 6)
      .style("stroke", "black")
      .style("stroke-width", data.noseWidth*3);

      // Draw mouth
      face.append("path")
      .attr("d", d3.arc()({
        innerRadius: data.mouthWidth / 2 *3,
        outerRadius: data.mouthWidth / 2 *3,
        startAngle: Math.PI - data.mouthCurve*3,
        endAngle: Math.PI + data.mouthCurve*3
      }))
      .attr("transform", `translate(0, ${faceRadius / 3})`)
      .style("fill", "none")
      .style("stroke", "black")
      .style("stroke-width", 2);

      return face;
    }

    var dataFaces = [];
    var categories = [];

    if (selectedCategory && Array.isArray(categoricalData)) {
      categories = Array.from(
        new Set(categoricalData.map(d => d[selectedCategory]))
      );
    }

    var colorFace = "rgba(78, 115, 223, 0.6)";
      
    if(selectedCategory!=null){
      colorFace = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeCategory10);
    }

 

    // Definir las características de las caras
    const faceCharacteristics = ['eyeSize', 'noseWidth', 'mouthWidth', 'mouthCurve', 'earSize', 'pupilSize'];
    const keys = identifiersList;
    const normalizedData = {};
    
    // Normalizar valores
    function normalize(values) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return values.map(value => (value - min) / (max - min));
    }

    keys.forEach(key => {
      const values = data.map(item => item[key]);
      normalizedData[key] = normalize(values);
    });

    // Mapear las características de las caras
    data.forEach((item, i) => {
      let faceData = {};
      faceCharacteristics.forEach((char, index) => {
        if (keys[index]) {
          faceData[char] = normalizedData[keys[index]][i];
        } else {
          faceData[char] = 0; // Valor por defecto si no hay suficientes columnas
        }
      });
      dataFaces.push(faceData);
    });
    
    const availableWidth = width ;
    const availableHeight = height ;
    const totalFaces = dataFaces.length;

    // Calcular número máximo de caras por fila (basado en proporción área)
    const maxFacesPerRow = Math.ceil(Math.sqrt(totalFaces * (availableWidth / availableHeight)));

    // Número de filas necesarias
    const numRows = Math.ceil(totalFaces / maxFacesPerRow);

    // Calcular el tamaño máximo por cara en cada dimensión
    const maxFaceWidth = availableWidth / maxFacesPerRow;
    const maxFaceHeight = availableHeight / numRows;

    // Elegir el menor para mantener la proporción cuadrada
    const faceSize = Math.min(maxFaceWidth, maxFaceHeight);

    // Espaciado proporcional (20% del tamaño)
    const spaceBetweenFaces = faceSize * 0.2;

    // Radio de la cara (ajustado para que quepa dentro del espacio con margen)
    const faceRadius = (faceSize - spaceBetweenFaces) / 2;

    var svg = d3.select("#" + id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
      .select("g")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var colors = []; 
    // Extraer los valores 
    categoricalData.forEach((item, i) => { 
      colors.push(item[selectedCategory]); 
    });
      
    var colorFace = "rgba(78, 115, 223, 0.6)";
    if(selectedCategory!=null){ 
      // Define the color scale. 
      colorFace = d3.scaleOrdinal() 
      .domain(colors) 
      .range(d3.schemeCategory10); 
    }


    dataFaces.forEach((d, i) => {
      const rowIndex = Math.floor(i / maxFacesPerRow);
      const colIndex = i % maxFacesPerRow;

      // Posiciones sumando márgenes
      const xPos = colIndex * faceSize + faceRadius;
      const yPos = margin.top + rowIndex * faceSize + faceRadius;
      // Definir color y opacidad (ajusta según tu lógica)
      var colorItem = (selectedCategory!=null)? colorFace(colors[i]): "rgba(78, 115, 223, 0.6)"; 
      var opacity = (selectedCategory!=null)? 0.5 : 1; 
        
      // Llamar a drawChernoffFace pasando faceRadius para que se ajuste
      const face = drawChernoffFace(svg, d, xPos, yPos, colorItem, opacity, faceRadius);
      face
        .attr("data-index", i)
        .attr("data-x", xPos)
        .attr("data-y", yPos);
    });  
    
    if (selectedCategory != null) {
      // Crear contenedor para la leyenda
      var legend = svg.append('g')
      .attr('transform', 'translate(' + (width + 20) + ', 0)'); // Posicionar leyenda

      // Definir los grupos de leyenda
      const categories = Array.from(new Set(colors));
    
      legend.selectAll('rect')
      .data(categories)
      .enter()
      .append('rect')
      .attr('x', -15)
      .attr('y', (d, i) => i * 20)
      .attr('width', 18)
      .attr('height', 18)
      .style("fill", d => colorFace(d));

      legend.selectAll('text')
      .data(categories)
      .enter()
      .append('text')
      .attr('x', 10)
      .attr('y', (d, i) => i * 20 + 15)
      .text(d => d)
      .style('font-size', '10px')
      .attr('fill', '#000');

    }

    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on("brush", brushed)
      .on("end", endBrushed);

    const brushGroup  = svg.append("g")
      .attr("class", "brush")
      .call(brush);

    brushGroup.select(".brush")
      .attr("fill", "none")        
      .attr("stroke", "black")     
      .attr("stroke-width", 1.5);  

    let selectedIndices = [];

    function brushed(event) {
      const selection = d3.event.selection;

      if (!selection) return;

      const [[x0, y0], [x1, y1]] = selection;

      selectedIndices = [];

      svg.selectAll(".faces")
        .style("opacity", function() {
          const x = +d3.select(this).attr("data-x");
          const y = +d3.select(this).attr("data-y");
          const i = +d3.select(this).attr("data-index");

          const isSelected = x >= x0 && x <= x1 && y >= y0 && y <= y1;

          if (isSelected) selectedIndices.push(i);

          return isSelected ? 1 : 0.2;
        });
    }

    function endBrushed(event) {
      if (!d3.event.selection) {
        const all = data.map((_, i) => i);

        svg.selectAll(".faces")
          .style("opacity", 1);

        setSelectedIds(all);
        return;
      }

      setSelectedIds(selectedIndices);
    }
  }

  function drawChart(){

    d3.select("#" + id).selectAll("*").remove();

    var margin = {
      top: 20,
      right: selectedCategory != null ? 120 : 50,
      bottom: 40,
      left: 40
    },
    width = document.getElementById(''+iddiv).offsetWidth - margin.left - margin.right,
    height = document.getElementById(''+iddiv).offsetHeight- document.getElementById(''+iddiv).offsetHeight/4 + margin.bottom;

    
    // append the svg object to the body of the page
    var svg = d3.select("#"+id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

    // Title
    svg.append('text')
    .attr('x', width/2)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .style('font-size', 20)
    .text('');

    function drawChernoffFace(svg, data, x, y, colorFace, opacity) {
      const face = svg.append("g")
      .attr("transform", `translate(${x}, ${y})`)
      .classed("faces", true);

      const faceRadius = 10;
      // Draw ears
      face.append("circle")
      .attr("cx", -faceRadius - data.earSize / 2)
      .attr("cy", 0)
      .attr("r", data.earSize*3)
      .style("fill", colorFace)
      .style("fill-opacity", opacity)
      .style("stroke", "black");

      face.append("circle")
      .attr("cx", faceRadius + data.earSize*3 / 2)
      .attr("cy", 0)
      .attr("r", data.earSize*3)
      .style("fill", colorFace)
      .style("fill-opacity", opacity)
      .style("stroke", "black");

      // Draw face
      face.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", faceRadius)
      .style("fill", colorFace)
      .style("fill-opacity", opacity)
      .style("stroke", "black");

      // Draw eyes with pupils
      face.append("circle")
      .attr("cx", -faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize*3)
      .style("fill", "white")
      .style("stroke", "black");

      face.append("circle")
      .attr("cx", -faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize * data.pupilSize *3)
      .style("fill", "black");

      face.append("circle")
      .attr("cx", faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize*3)
      .style("fill", "white")
      .style("stroke", "black");

      face.append("circle")
      .attr("cx", faceRadius / 3)
      .attr("cy", -faceRadius / 3)
      .attr("r", data.eyeSize * data.pupilSize *3)
      .style("fill", "black");

      // Draw nose
      face.append("line")
      .attr("x1", 0)
      .attr("y1", -faceRadius / 6)
      .attr("x2", 0)
      .attr("y2", faceRadius / 6)
      .style("stroke", "black")
      .style("stroke-width", data.noseWidth*3);

      // Draw mouth
      face.append("path")
      .attr("d", d3.arc()({
        innerRadius: data.mouthWidth / 2 *3,
        outerRadius: data.mouthWidth / 2 *3,
        startAngle: Math.PI - data.mouthCurve*3,
        endAngle: Math.PI + data.mouthCurve*3
      }))
      .attr("transform", `translate(0, ${faceRadius / 3})`)
      .style("fill", "none")
      .style("stroke", "black")
      .style("stroke-width", 2);

      return face;
    }

    var svg = d3.select("#" + id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
      .select("g")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);


    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, 1])
    .range([ height, 0]);
    
    svg.append("g")
    .classed("axisy",true)
    .call(d3.axisLeft(y));

    // Add X axis
    var x = d3.scaleLinear()
    .domain([0, 1])
    .range([ 0, width ]);
      
    svg.append("g")
    .classed("axisy",true)
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // X label
    svg.append('text')
    .attr('x', width/2)
    .attr('y', height+30)
    .classed("axisx",true)
    .attr('text-anchor', 'middle')
    .text(identifiersList[selectedOption[0]]);

    // Y label
    svg.append('text')
    .attr('text-anchor', 'middle')
    .classed("axisy",true)
    .attr('transform', 'translate(-30,' + height/2 + ')rotate(-90)')
    .text(identifiersList[selectedOption[1]]);


    var coordx = [], coordy = [];
    var dataFaces = [];
    var colors = [];

    // Extraer los valores
    data.forEach((item, i) => {
      coordx.push(item[identifiersList[selectedOption[0]]]);
      coordy.push(item[identifiersList[selectedOption[1]]]);
      colors.push(categoricalData[i][selectedCategory]);
    });

    var colorFace = "rgba(78, 115, 223, 0.6)";
    if(selectedCategory!=null){
      // Define the color scale.
      colorFace = d3.scaleOrdinal()
      .domain(colors)
      .range(d3.schemeCategory10);
    }

    // Definir las características de las caras
    const faceCharacteristics = ['eyeSize', 'noseWidth', 'mouthWidth', 'mouthCurve', 'earSize', 'pupilSize'];
    const keys = identifiersList.filter((label) => label!==selectedOption[0] && label!==selectedOption[1]);
    const normalizedData = {};
    
    // Normalizar valores
    function normalize(values) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return values.map(value => (value - min) / (max - min));
    }

    keys.forEach(key => {
      const values = data.map(item => item[key]);
      normalizedData[key] = normalize(values);
    });

    // Mapear las características de las caras
    data.forEach((item, i) => {
      let faceData = {};
      faceCharacteristics.forEach((char, index) => {
        if (keys[index]) {
          faceData[char] = normalizedData[keys[index]][i];
        } else {
          faceData[char] = 0; // Valor por defecto si no hay suficientes columnas
        }
      });
      dataFaces.push(faceData);
    });

    // Escalar ejes X e Y
    var x = d3.scaleLinear()
    .domain([Math.min(...coordx), Math.max(...coordx)])
    .range([0, width]);

    var y = d3.scaleLinear()
    .domain([Math.min(...coordy), Math.max(...coordy)])
    .range([height, 0]);

    dataFaces.forEach((d, i) => {
      var colorItem = (selectedCategory!=null)? colorFace(colors[i]): "rgba(78, 115, 223, 0.6)"
      var opacity = (selectedCategory!=null)? 0.5: 1
      const face = drawChernoffFace(svg, d, x(coordx[i]), y(coordy[i]), colorItem, opacity);
      face
        .attr("data-index", i)
        .attr("data-x", x(coordx[i]))
        .attr("data-y", y(coordy[i]));
    });

    if (selectedCategory != null) {
      // Crear contenedor para la leyenda
      var legend = svg.append('g')
      .attr('transform', 'translate(' + (width + 20) + ', 0)'); // Posicionar leyenda

      // Definir los grupos de leyenda
      const categories = Array.from(new Set(colors));
    
      legend.selectAll('rect')
      .data(categories)
      .enter()
      .append('rect')
      .attr('x', -15)
      .attr('y', (d, i) => i * 20)
      .attr('width', 18)
      .attr('height', 18)
      .style("fill", d => colorFace(d));

      legend.selectAll('text')
      .data(categories)
      .enter()
      .append('text')
      .attr('x', 10)
      .attr('y', (d, i) => i * 20 + 15)
      .text(d => d)
      .style('font-size', '10px')
      .attr('fill', '#000');

    }

    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on("brush", brushed)
      .on("end", endBrushed);

    const brushGroup  = svg.append("g")
      .attr("class", "brush")
      .call(brush);

    brushGroup.select(".brush")
      .attr("fill", "none")        
      .attr("stroke", "black")     
      .attr("stroke-width", 1.5);

    let selectedIndices = [];

    function brushed(event) {
      const selection = d3.event.selection;

      if (!selection) return;

      const [[x0, y0], [x1, y1]] = selection;

      selectedIndices = [];

      svg.selectAll(".faces")
        .style("opacity", function() {
          const x = +d3.select(this).attr("data-x");
          const y = +d3.select(this).attr("data-y");
          const i = +d3.select(this).attr("data-index");

          const isSelected = x >= x0 && x <= x1 && y >= y0 && y <= y1;

          if (isSelected) selectedIndices.push(i);

          return isSelected ? 1 : 0.2;
        });
    }

    function endBrushed(event) {
      if (!d3.event.selection) {
        const all = data.map((_, i) => i);

        svg.selectAll(".faces")
          .style("opacity", 1);

        setSelectedIds(all);
        return;
      }

      setSelectedIds(selectedIndices);
    }
  }

  function selectAxesType(evt){
    let axes = evt.toString();
    setAxesType(axes);
  }

  function selectOption(evt,id){
    let option = parseInt(evt.toString()[4]);
    let selectedOp = selectedOption;

    if(id == 0){ //selecciono eje x
      d3.select("#"+iddiv).select(".axisx").text(""+identifiersList[option]);
      setElementX(identifiersList[option])
      selectedOp[0] = option;
      setSelectedOption(selectedOp);
    }
    else {//selecciono eje y
      d3.select("#"+iddiv).select(".axisy").text(""+identifiersList[option]);
      setElementY(identifiersList[option]);
      selectedOp[1] = option;
      setSelectedOption(selectedOp);
    }
  
    if(selectedOp[0]>-1 && selectedOp[1]>-1){
      drawChart();
    }
  }

  return (
    <div>
      <div className={"configuration"} style={{display:"flex"}}>
        <p> axes-type:</p>
        <div className="dropdown-option" style={{display:"flex"}}>
          <DropdownButton title={axesType} id={"btn-axisx"} onSelect={(e) => selectAxesType(e)}>
            <Dropdown.Item id={"axes0"} key={"Unstructured"} eventKey={"Unstructured"}> Unstructured</Dropdown.Item>
            <Dropdown.Item id={"axes1"} key={"Quantitative"} eventKey={"Quantitative"}> Quantitative</Dropdown.Item>
          </DropdownButton>
        </div>
        <p> x-axis:</p>
        <div className="dropdown-option" style={{display:"flex"}}>
          <DropdownButton 
            title={elementX} 
            id={"btn-axisx"} 
            className="dropdown-up" 
            onSelect={(e) => selectOption(e,0)}
            disabled={axesType==='Unstructured' ? true : false}
            >
            {xOptions}
          </DropdownButton>
        </div>
        <p> y-axis:</p>
        <div className="dropdown-option" style={{display:"flex"}}>
          <DropdownButton 
            title={elementY} 
            id={"btn-axisy"} 
            className="dropdown-up" 
            onSelect={(e) => selectOption(e,1)}
            disabled={axesType==='Unstructured' ? true : false}
            >
            {yOptions}
          </DropdownButton>
        </div> 
      </div>
      <svg id={id} ref={svgRef}></svg>
    </div>
  );
}