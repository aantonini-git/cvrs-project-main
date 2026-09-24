import { useEffect, useRef, useState, useContext } from "react";
import { DataContext } from "../../context/DataContext.jsx";

import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
import * as d3 from "d3";
import { PCA } from "ml-pca";
import "./Styles/RadvizStyles.css";

export default function PCATechnique({ id, iddiv, flag}) {
  
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);
  
  const tooltipRef = useRef(null);

  const [identifiersOptions] = useState(
    identifiersList.map((label, i) => ({ label, key: i }))
  );

  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    updateSelectedData();
  }, [selectedIds, selectedCategory]);

  useEffect(() => {
    if (selectedOptions.length < 2) return;

    // ---------- LIMPIAR SVG ----------
    d3.select("#" + id).selectAll("*").remove();

    // ---------- DIMENSIONES ----------
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };
    const width =
      document.getElementById(iddiv).offsetWidth -
      margin.left -
      margin.right;
    const height =
      document.getElementById(iddiv).offsetHeight -
      margin.top -
      margin.bottom;

    const svg = d3
      .select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ---------- MATRIZ DE DATOS ----------
    const matrix = data.map(d =>
      selectedOptions.map(f => d[f])
    );

    // ---------- PCA REAL ----------
    const pca = new PCA(matrix, { scale: true, center: true });
    const projected = pca
      .predict(matrix, { nComponents: 2 })
      .to2DArray();

    // ---------- ESCALAS ----------
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(projected, d => d[0]))
      .nice()
      .range([40, width - 40]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(projected, d => d[1]))
      .nice()
      .range([height - 40, 40]);

    // ---------- EJES CON TICKS ----------
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale).ticks(6);

    // PC1 (horizontal)
    svg.append("g")
      .attr("transform", `translate(0, ${yScale(0)})`)
      .call(xAxis)
      .call(g => g.select(".domain").attr("stroke", "#aaa"))
      .call(g => g.selectAll("text").style("font-size", "11px"));

    // PC2 (vertical)
    svg.append("g")
      .attr("transform", `translate(${xScale(0)}, 0)`)
      .call(yAxis)
      .call(g => g.select(".domain").attr("stroke", "#aaa"))
      .call(g => g.selectAll("text").style("font-size", "11px"));

    // ---------- LABELS ----------
    svg.append("text")
      .attr("x", width - 10)
      .attr("y", yScale(0) - 6)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .text("PC1");

    svg.append("text")
      .attr("x", xScale(0) + 6)
      .attr("y", 12)
      .style("font-size", "12px")
      .text("PC2");

    // ---------- COLOR ----------
    let color = () => "#4e73df";
    if (selectedCategory != null) {
      color = d3
        .scaleOrdinal()
        .domain(categoricalData.map(d => d[selectedCategory]))
        .range(d3.schemeCategory10);
    }

    // ---------- DATOS ----------
    const pointsData = projected.map((p, i) => ({
      x: xScale(p[0]),
      y: yScale(p[1]),
      color:
        selectedCategory != null
          ? categoricalData[i][selectedCategory]
          : null,
      raw: data[i]
    }));

    // ---------- PUNTOS ----------
    svg.append("g")
      .selectAll("circle")
      .data(pointsData)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 2.5)
      .attr("fill", d => (d.color ? color(d.color) : "#4e73df"))
      .on("mousemove", function (event) {
        const tt = d3.select(tooltipRef.current);
        tt.style("opacity", 1)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseout", () =>
        d3.select(tooltipRef.current).style("opacity", 0)
      );

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
          svg.selectAll("circle")
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

        svg.selectAll("circle")
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
  }, [data, flag, selectedOptions, selectedCategory]);

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
    
    svg.selectAll("circle")
      .style("fill", function(d, i) { 
      
        // Si el índice está seleccionado, aplica un color fuerte
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
      });
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
      <div ref={tooltipRef} className="tooltip" />
    </div>
  );
}
