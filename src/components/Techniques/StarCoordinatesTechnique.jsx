import { useEffect, useRef, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
import * as d3 from "d3";
import './Styles/RadvizStyles.css';

export default function StarCoordinatesTechnique({ id, iddiv, userConfigArray, flag }) {
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

  const [identifiersOptions] = useState(
    identifiersList.map((label, i) => ({ label, key: i }))
  );

  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    if (selectedOptions.length === 0) return;

    const features = selectedOptions;

    /* =========================
       NORMALIZACIÓN
    ========================= */
    const scales = {};
    features.forEach(f => {
      const extent = d3.extent(data, d => d[f]);
      scales[f] = d3.scaleLinear().domain(extent).range([0, 1]);
    });

    /* =========================
       SVG SETUP
    ========================= */
    d3.select("#" + id).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 80, left: 20 };
    const width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
    const height = document.getElementById(iddiv).offsetHeight - margin.top - margin.bottom;

    const svg = d3.select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g");

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    /* =========================
       ANCHORS (EJES)
    ========================= */
    const anchors = features.map((f, i) => {
      const angle = (i / features.length) * 2 * Math.PI - Math.PI / 2;
      return {
        feature: f,
        angle,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      };
    });

    /* =========================
       COLOR
    ========================= */
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    if (selectedCategory != null) {
      color = d3.scaleOrdinal()
        .domain(categoricalData.map(d => d[selectedCategory]))
        .range(d3.schemeCategory10);
    }

    const g = svg.append("g");

    /* =========================
       ESTRUCTURA VISUAL
    ========================= */
    g.append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "black");

    const anchorG = g.append("g").attr("class", "anchors");

    anchorG.selectAll("line")
      .data(anchors)
      .enter()
      .append("line")
      .attr("x1", cx)
      .attr("y1", cy)
      .attr("x2", d => d.x)
      .attr("y2", d => d.y)
      .attr("stroke", "#bbb");

    anchorG.selectAll("text")
      .data(anchors)
      .enter()
      .append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("dy", d => Math.sin(d.angle) > 0 ? "1.2em" : "-.4em")
      .attr("text-anchor", d =>
        Math.cos(d.angle) > 0.1 ? "start" :
        Math.cos(d.angle) < -0.1 ? "end" : "middle"
      )
      .text(d => d.feature.replace(/([A-Z])/g, " $1"))
      .style("font-size", "12px");

    /* =========================
       STAR COORDINATES PROJECTION
       (SIN DIVISIÓN)
    ========================= */
    const projected = data.map((d, i) => {
      let x = cx;
      let y = cy;

      features.forEach((f, j) => {
        const v = Math.max(0, scales[f](d[f]));
        x += v * anchors[j].vx * radius;
        y += v * anchors[j].vy * radius;
      });

      return {
        x,
        y,
        color: selectedCategory != null ? categoricalData[i][selectedCategory] : null
      };
    });

    /* =========================
       DRAW POINTS
    ========================= */
    const points = g.append("g")
      .attr("class", "points")
      .selectAll("circle")
      .data(projected)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 2)
      .attr("fill", d => d.color ? color(d.color) : "#4e73df")
      .attr("opacity", 1);

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
        points
          .attr("fill", (d, i) =>
            selectedCategory != null
              ? color(categoricalData[i][selectedCategory])
              : "#4e73df");
              setSelectedIds([]); // limpiar selección
              return;
      }
          
      const [[x0, y0], [x1, y1]] = d3.event.selection;
      const selected = [];
          
      points
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

  useEffect(() => {
    updateSelectedData();
  },[selectedIds, selectedCategory]);

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
      .filter(item => selectedList.includes(item.key.toString()))
      .map(item => item.label);

    setSelectedOptions(result);
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
          options={identifiersOptions}
          handleOnChange={onSelect}
        />
      </div>
      <svg id={id}></svg>
    </div>
  );
}

