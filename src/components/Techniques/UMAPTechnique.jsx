import { useEffect, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx"; 

import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import './Styles/UMAPStyles.css';
import * as d3 from "d3";
import { UMAP } from 'umap-js';


export default function UMAPTechnique({ id, iddiv, userConfigArray, flag}) {
 
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

  const [supervised, setSupervised] = useState('supervised');
  const [nNeighbors, setnNeighbors] = useState(15);
  const [minDist, setMinDist] = useState(0.1);

  useEffect(() => {
    drawChart();
  }, [data, nNeighbors,minDist,supervised, flag]);

  useEffect(() => {
    updateSelectedData();
  }, [selectedIds, selectedCategory]);

  function selectnNeighbors(evt){
    setnNeighbors(evt.target.value);
  }

  function selectminDist(evt){
    setMinDist(evt.target.value);
  }

  function selectSupervisedOption(evt){
    setSupervised(evt);
  }

  function drawChart(){

    d3.select("#" + id).selectAll("*").remove();

    // Definir dimensiones (se agranda el margen derecho para la leyenda)
    var margin = {top: 20, right: 150, bottom: 40, left: 40};
    var width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
    var height = document.getElementById(iddiv).offsetHeight - document.getElementById(iddiv).offsetHeight / 4 - margin.top - margin.bottom;
    var padding = 15;

    // Crear el SVG y agregar el grupo de gráficos con márgenes
    var svg = d3.select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Preparar los datos incluyendo las categorías
    var dd = [];
    data.forEach((item, i) => {
      const element = {};
      identifiersList.forEach((item1) => {
        element[item1] = item[item1];
      });
      element['index'] = item.index;
      element['color'] = categoricalData[i][selectedCategory]; // puede ser undefined
      dd.push(element);
    });
    

    // Definir la escala de colores
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    if (selectedCategory != null) {
      color = d3.scaleOrdinal()
        .domain(dd.map(d => d['color']))
        .range(d3.schemeCategory10);
    }

    // Convertir datos a matriz numérica
    function convertToMatrix(data) {
      const keys = Object.keys(data[0]).filter(key => key !== 'index');
      return data.map(item => {
        return keys.map(key => item[key] !== '' ? parseFloat(item[key]) : null).filter(v => v !== null);
      });
    }

    function standardScaler(data) {
      const means = [];
      const stds = [];
      const numFeatures = data[0].length;

      for (let j = 0; j < numFeatures; j++) {
        let mean = 0;
        let std = 0;
        for (let i = 0; i < data.length; i++) mean += data[i][j];
        mean /= data.length;
        means[j] = mean;
        for (let i = 0; i < data.length; i++) std += Math.pow(data[i][j] - mean, 2);
        std = Math.sqrt(std / data.length);
        stds[j] = std;
      }

      return data.map(row => row.map((value, i) => (value - means[i]) / stds[i]));
    }

    const matrix = convertToMatrix(data);
    const scaledData = standardScaler(matrix);

    // Crear instancia UMAP
    const umap = new UMAP({
      nComponents: 2,
      nNeighbors: nNeighbors,
      minDist: minDist,
      nEpochs: 500,
    });

    if(supervised === "supervised") umap.setSupervisedProjection(dd.map(d => d['color']));
    const embedding = umap.fit(scaledData);

    // Escalas para ajustar al SVG
    const xScale = d3.scaleLinear()
      .domain([d3.min(embedding, d => d[0]), d3.max(embedding, d => d[0])])
      .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(embedding, d => d[1]), d3.max(embedding, d => d[1])])
      .range([height - padding, padding]);

    // Agregar coordenadas a los datos
    dd.forEach((d, i) => {
      d['x'] = embedding[i][0];
      d['y'] = embedding[i][1];
    });

    // Dibujar puntos
    const points = svg.append("g")
      .attr("class", "points")
      .selectAll('circle')
      .data(dd)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d['x']))
      .attr('cy', d => yScale(d['y']))
      .attr("r", 2)
      .style("fill", d => d['color'] ? color(d['color']) : "#4e73df")
      .attr("data-index", d => d.index);

    // Brush
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on("end", brushed);

    svg.append("g")
      .attr("class", "brush")
      .call(brush);

    function brushed(event) {

      if (!d3.event.selection) {
        points
          .style("fill", d => d.color ? color(d.color) : "#4e73df");
        setSelectedIds([]);
        return;
      }

      const [[x0, y0], [x1, y1]] = d3.event.selection;
      const selected = [];

      points
        .style("fill", function(d) {
          const cx = xScale(d.x);
          const cy = yScale(d.y);
          const isSelected =
            x0 <= cx && cx <= x1 &&
            y0 <= cy && cy <= y1;

          if (isSelected) selected.push(d.index);

          return isSelected
                ? (selectedCategory!=null 
                  ? color(categoricalData[d.index][selectedCategory]) 
                    : "#4e73df")
                : "rgba(0,0,0,0.2)";
        });

      // traer seleccionados adelante
      points
        .filter(d => selected.includes(d.index))
        .raise();

      setSelectedIds(selected);
    }


    // Leyenda
    if (selectedCategory != null) {
      var legend = svg.append('g')
        .attr('transform', 'translate(' + (width + 20) + ', 20)');
      var categories = Array.from(new Set(dd.map(d => d['color'])));
      legend.selectAll('rect')
        .data(categories)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d,i) => i*20)
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', d => color(d));
      legend.selectAll('text')
        .data(categories)
        .enter()
        .append('text')
        .attr('x', 25)
        .attr('y', (d,i) => i*20 + 15)
        .text(d => d)
        .style('font-size', '12px')
        .attr('fill', '#000');
    }
  }

  function updateSelectedData(){

    // Dibujar las líneas de datos
    let categories = [];
    if (selectedCategory && Array.isArray(categoricalData)) {
      categories = Array.from(new Set(categoricalData.map(d => d[selectedCategory])));
    }
        
    // Escala de colores
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    if (categories) {
      color = d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10);
    }

    var svg = d3.select("#" + id);
    var points = svg.select("g").select(".points").selectAll("circle");

    points
      .style("fill", function(d, i) { 
        // Si el índice está seleccionado, aplica un color fuerte
        if (selectedIds.includes(d.index)) {
          return selectedCategory !== null
            ? color(categoricalData[d.index][selectedCategory])
              : "#4E73DF";  // Color por defecto si no hay categoría seleccionada
        }
    
        // Si no hay selecciones, aplica el color por defecto a todas
        if (selectedIds.length === 0) {
          return selectedCategory !== null
            ? color(categoricalData[d.index][selectedCategory])
              : "#4E73DF";
        }
    
        // Si no está seleccionado, aplica un color desactivado (transparente)
          return "rgba(0,0,0,0.2)";
      });
  }

  return (
    <div>
      <div className="configuration" style={{ display: "flex" }}>
        <p> type:</p>
        <div className="dropdown-option" style={{ display: "flex" }}>
          <DropdownButton  title={supervised} id={"btn-axisx"} onSelect={(e) => selectSupervisedOption(e)}>
            <Dropdown.Item id={"supervised"} key={"supervised"} eventKey={"supervised"}> supervised</Dropdown.Item>
            <Dropdown.Item id={"unsupervised"} key={"unsupervised"} eventKey={"unsupervised"}> unsupervised</Dropdown.Item>
          </DropdownButton>
        </div>
        <div className='input-option'>
          <p> n-neighbors: {nNeighbors} </p>
          <input type="range" min="0" max="100" step="10" value={nNeighbors} onChange={(e)=>selectnNeighbors(e)} style={{width: '100px'}}/>
        </div>
        <div className='input-option'>
          <p> min-dist: {minDist} </p>
          <input type="range" min="0.1" max="1" step="0.1" value={minDist} onChange={(e)=>selectminDist(e)} style={{width: '100px'}}/>
        </div>
      </div>
      <svg id={id}></svg>
    </div>
  );
}
