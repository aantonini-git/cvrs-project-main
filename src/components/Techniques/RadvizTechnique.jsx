import { useEffect, useRef, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
import * as d3 from "d3";
import './Styles/RadvizStyles.css';

// Radviz component for the Iris dataset
// Usage: <RadvizIris width={700} height={700} />

export default function RadvizTechnique({ id, iddiv, userConfigArray, flag}) {
  
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

  const tooltipRef = useRef(null);
  const [identifiersOptions, setIdentifiersOptions] = useState(
      identifiersList.map((label, i) => ({ label, key: i }))
    );

  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    updateSelectedData();
  }, [selectedIds, selectedCategory]);

  useEffect(() => {
    // feature names and anchors

    const features = selectedOptions;

    // compute min/max for normalization
    const scales = {};
    features.forEach((f) => {
      const extent = d3.extent(data, (d) => d[f]);
      // create linear scale to [0,1]
      scales[f] = d3.scaleLinear().domain(extent).range([0, 1]);
    });

    // SVG setup
    d3.select("#" + id).selectAll("*").remove();

    // Definir dimensiones (se agranda el margen derecho para la leyenda)
    var margin = {top: 20, right: 20, bottom: 80, left: 20};
    var width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
    var height = document.getElementById(iddiv).offsetHeight - margin.top - margin.bottom;
    
    // Crear el SVG y agregar el grupo de gráficos con márgenes
    var svg = d3.select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + 0 + ',' + 0 + ')');

      // CENTRO Y RADIO DEL CÍRCULO
    var cx = width / 2;
    var cy = height / 2;
    var radius = Math.min(width, height) / 2 - 40;
   

    // anchor points placed evenly on circle
    const anchors = features.map((f, i) => {
      const angle = (i / features.length) * 2 * Math.PI - Math.PI / 2; // start at top
      return {
        feature: f,
        angle,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    // Preparar los datos incluyendo las categorías
    var dd = [];
    data.forEach((item, i) => {
      const element = {};
      identifiersList.forEach((item1) => {
        element[item1] = item[item1];
      });
      element['index'] = item.index;
      element['color'] = categoricalData[i][selectedCategory];
      dd.push(element);
    });
        
        
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    if(selectedCategory!=null){
      // Define the color scale.
      color = d3.scaleOrdinal()
      .domain(dd.map(d => d['color']))
      .range(d3.schemeCategory10);
    }
    const g = svg.append("g");
    
    g.append("circle")
      .attr("class", "radviz-circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", radius)
      .attr("stroke-width",1)
      .attr("fill", "none")
      .attr("stroke", "black");

    // draw anchors
    const anchorG = g.append("g").attr("class", "anchors");

    anchorG.selectAll("line")
      .data(anchors)
      .enter()
      .append("line")
      .attr("x1", cx)
      .attr("y1", cy)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y)
      .attr("opacity",0)
      .attr("stroke", "#bbb");

    anchorG.selectAll("circle.anchor-point")
      .data(anchors)
      .enter()
      .append("circle")
      .attr("class", "anchor-point")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 3)
      .attr("fill", "black");

    anchorG.selectAll("text")
      .data(anchors)
      .enter()
      .append("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("dy", (d, i) => (Math.sin(d.angle) > 0 ? "1.2em" : "-.4em"))
      .attr("text-anchor", (d) => (Math.cos(d.angle) > 0.1 ? "start" : (Math.cos(d.angle) < -0.1 ? "end" : "middle")))
      .text((d) => d.feature.replace(/([A-Z])/g, " $1"))
      .style("font-size", "12px")
      .style("fill", "#333");

    // compute projected points (radviz formula)
    const projected = data.map((d, i) => {
    const vals = features.map((f) => Math.max(0, scales[f](d[f])));
    const denom = d3.sum(vals);
    const x = denom === 0 ? cx : d3.sum(vals.map((v, i) => v * anchors[i].x)) / denom;
    const y = denom === 0 ? cy : d3.sum(vals.map((v, i) => v * anchors[i].y)) / denom;

    // asignar color aquí
    const colorValue = selectedCategory != null ? categoricalData[i][selectedCategory] : null;

    return { x, y, data: d, color: colorValue };
  });

    // draw data points
    const points = g.append("g").attr("class", "points");

    points.selectAll("circle")
      .data(projected)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 2)
      .attr("fill", d => d.color ? color(d.color) : "#4e73df")
      .attr("stroke", "none")
      .attr("opacity", 1)
      .on("mousemove", function (event) {
        const tt = d3.select(tooltipRef.current);
        tt.style("left", event.pageX + 10 + "px").style("top", event.pageY + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(tooltipRef.current).style("opacity", 0);
      });

      // ---------- BRUSH ----------
      const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        //.on("start brush", brushed)
        .on("end", brushed);
      
      svg.append("g")
        .attr("class", "brush")
        .call(brush);
      
      // ---------- FUNCIÓN BRUSH ----------
      function brushed(event) {
        if (!d3.event.selection) {
          points.selectAll("circle")
            .attr("fill", (d, i) =>
              selectedCategory != null
                ? color(categoricalData[i][selectedCategory])
                : "#4e73df"
              );
              setSelectedIds([]); // limpiar selección
              return;
        }
      
        const [[x0, y0], [x1, y1]] = d3.event.selection;
        const selected = [];
      
        points.selectAll("circle")
          .attr("fill", function(d,i) {
            const isSelected =
              x0 <= d.x && d.x <= x1 &&
              y0 <= d.y && d.y <= y1;
      
            if(isSelected) selected.push(i); 
                return isSelected
                  ? (selectedCategory!=null 
                    ? color(categoricalData[i][selectedCategory]) 
                      : "#4e73df")
                  : "rgba(0,0,0,0.2)";
          })
          setSelectedIds(selected);
        }

  }, [data, flag, selectedOptions]);

  function updateSelectedData(){
    var points = d3.select("#" + id).selectAll(".points");
    
    let categories = [];
    if (selectedCategory && Array.isArray(categoricalData)) {
      categories = Array.from(new Set(categoricalData.map(d => d[selectedCategory])));
    }
    
    // Escala de colores
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    if (categories) {
      color = d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10);
    }
              
    points.selectAll("circle")
      .attr("fill", function(d,i) {
        if (selectedIds.includes(i)) {
          return selectedCategory !== null
            ? color(categoricalData[i][selectedCategory])
            : "#4E73DF";  // Color por defecto si no hay categoría seleccionada
        }

        // Si no hay selecciones, aplica el color por defecto a todas
        if (selectedIds.length === 0) {
          return selectedCategory !== null
            ? color(categoricalData[i][selectedCategory])
            : "#4E73DF";
        }

        // Si no está seleccionado, aplica un color desactivado (transparente)
        return "rgba(0,0,0,0.2)";
      }) 
  }

  function onSelect(selectedList) {
 
    const result = identifiersOptions
      .filter(item => selectedList.includes(item.key.toString())) // filtrar solo los que estén en selectedKeys
      .map(item => ({
        name: item.label,
        id: Number(item.key) // convertir a número
    }));

    var aux = [];
    result.forEach((element) => aux.push(element.name));


    setSelectedOptions(aux)
  }

  const dropdownId = `${id}-dropdown`;

  return (
    <div>
      <div className="configuration dropdown-option" style={{display:"flex", marginTop:"10px"}}>
        <p> select axis:</p>
        <DropdownMultiselect
          id={dropdownId}
          name={dropdownId}
          className="dropdown-up"
          options={identifiersOptions} // Options to display in the dropdown
          handleOnChange={onSelect}
        />
      </div>
      <svg id={id}></svg>
    </div>
  );
}
