import { useEffect, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
//https://www.npmjs.com/package/react-multiselect-dropdown-bootstrap
import * as d3 from "d3";
import './Styles/RadialCoordinatesStyles.css';

export default function RadialCoordinatesTechnique({ id, iddiv, userConfigArray, flag }) {
 
  const { data, setData, selectedIds, setSelectedIds, categoricalData, setCategoricalData,
    selectedCategory, setSelectedCategory, identifiersList} = useContext(DataContext);

  const [identifiersOptions, setIdentifiersOptions] = useState(
    identifiersList.map((label, i) => ({ label, key: i }))
  );
  const [selectedList, setSelectedList] = useState([]);

  useEffect(() => {
    drawChart();
  }, [flag,selectedList]);

  useEffect(() => {
      const svg = d3.select("#" + id);
  
      if (svg.empty()) return;
  
      svg.selectAll(".legend").remove();
      const svgWidth = +svg.attr("width");
      const legendX = svgWidth - 100;
  
      let color = d3.scaleOrdinal(d3.schemeCategory10);
      let categories = [];
  
      if (selectedCategory != null) {
        const datad = data.map((d, i) => ({
          color: categoricalData[i][selectedCategory]
        }));
  
        categories = [...new Set(datad.map(d => d.color))];
  
        color = d3.scaleOrdinal()
          .domain(categories)
          .range(d3.schemeCategory10);
  
        const width = svg.node().getBoundingClientRect().width;
  
        const legend = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${legendX}, 20)`);
  
        legend.selectAll("rect")
          .data(categories)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d, i) => i * 20)
          .attr("width", 12)
          .attr("height", 12)
          .style("fill", d => color(d));
  
        legend.selectAll("text")
          .data(categories)
          .enter()
          .append("text")
          .attr("x", 18)
          .attr("y", (d, i) => i * 20 + 10)
          .text(d => d)
          .style("font-size", "10px")
          .attr("fill", "#000");
  
        legend.call(
          d3.drag()
            .on("start", function (event) {
              const transform = d3.select(this).attr("transform");
              const coords = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
  
              this.offsetX = d3.event.x - (coords ? +coords[1] : 0);
              this.offsetY = d3.event.y - (coords ? +coords[2] : 0);
            })
            .on("drag", function (event) {
              const x = d3.event.x - this.offsetX;
              const y = d3.event.y - this.offsetY;
  
              d3.select(this)
                .attr("transform", `translate(${x}, ${y})`);
            })
        );
      }
  
      svg.select("g.active")
        .selectAll("path")
        .transition()
        .duration(300)
        .style("stroke", (d, i) => {
          if (selectedCategory == null) return "#4E73DF";
          return color(categoricalData[i][selectedCategory]);
        });
  
    }, [selectedCategory]);

  useEffect(()=>{
      let children = [];

      for(let i = 0; i<identifiersList.length; i++){
        children.push({label:identifiersList[i] , key:i});
      }

      setIdentifiersOptions(children);
  },[data]);

  useEffect(() => {
    updateSelectedData(selectedIds);
  }, [selectedIds]);

   function updateSelectedData(selectedDataIds){
    d3.select("#"+id).select('g.active').selectAll('path')
    .style('display', function(d,i){
      if(selectedDataIds.includes(i) || selectedDataIds.length==0){
        return null;
      }
      else {
        return 'none';
      }
    })
  }

  function onSelect(selectedList) {
    const result = identifiersOptions
      .filter(item => selectedList.includes(item.key.toString())) // filtrar solo los que estén en selectedKeys
      .map(item => ({
        name: item.label,
        key: Number(item.key) // convertir a número
    }));
    setSelectedList(result);
  }

  function drawChart(){
    // Limpiar SVG existente
    d3.select(`#${id}`).selectAll("*").remove();

    // Definir dimensiones
    const margin = { top: 0, right: 50, bottom: 40, left: 40 };
    const width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
    const height = document.getElementById(iddiv).offsetHeight - document.getElementById(iddiv).offsetHeight / 5 - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;
    const brushWidth = 20;  // Ajusta el ancho del brush si es necesario

    // Crear SVG
    const svg = d3.select(`#${id}`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 + 20})`);

    // Preparar datos
    const datad = data.map((item, i) => {
      const element = {};
      selectedList.forEach(item1 => {
        element[item1.name] = item[item1.name];
      });
      element['color'] = categoricalData[i][selectedCategory];
      return element;
    });

    // Definir características y sus rangos
    const features = selectedList.map(item => ({
      name: item.name,
      range: d3.extent(datad, d => d[item.name])
    }));

    // Definir escala de colores
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    if (selectedCategory != null) {
      color = d3.scaleOrdinal()
        .domain(datad.map(d => d['color']))
        .range(d3.schemeCategory10);
    }

    // Configuración de ángulos y escala radial
    const angleSlice = Math.PI * 2 / features.length;
    const radialScale = d3.scaleLinear()
      .domain([0, d3.max(features.map(f => f.range[1]))])
      .range([0, radius]);

    // Definir escalas y dominios para cada característica
    const ydomain = {};
    features.forEach(d => {
      ydomain[d.name] = d3.scaleLinear()
        .domain(d.range)
        .range([0, radius]);
    });

    // Función para convertir ángulo y valor a coordenadas
    function angleToCoord(angle, value) {
      return {
        x: Math.cos(angle - Math.PI / 2) * value,
        y: Math.sin(angle - Math.PI / 2) * value
      };
    }

    // Dibujar áreas de datos
    const path_gen = d => {
      const points = features.map((p, i) => {
        const angle = angleSlice * i;
        const value = ydomain[p.name](d[p.name]);
        return angleToCoord(angle, value);
      });
      //return d3.line().curve(d3.curveCardinalClosed.tension(0.5)) //curva o recta
      return d3.line().curve(d3.curveLinearClosed) //curva o recta
        .x(d => d.x)
        .y(d => d.y)(points);
    };

    svg.append("g")
      .attr('class','inactive')
      .selectAll(".items")
      .data(datad)
      .enter()
      .append("path")
      .attr("d", path_gen)

    svg.append("g")
      .attr('class','active')
      .selectAll(".items")
      .data(datad)
      .enter()
      .append("path")
      .attr("d", path_gen)
      .style("stroke", d => selectedCategory!=null? color(d['color']): "#4E73DF")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 1);


    // Dibujar ejes radiales
    features.forEach((attr, i) => {
      const angle = angleSlice * i;
      const lineCoords = angleToCoord(angle, radius);
      svg.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", lineCoords.x)
        .attr("y2", lineCoords.y)
        .style("stroke", "#333")
        .style("stroke-width",1)
        .attr("class", "axis");

      svg.append("text")
        .attr("x", lineCoords.x)
        .attr("y", lineCoords.y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(attr.name);
    });

    // Añadir brushes radiales
    const brushes = {};
    const filters = {};

    features.forEach((feature, i) => {
      const angle = angleSlice * i;

      const brush = d3.brushY()
        .extent([[-brushWidth / 2, 0], [brushWidth / 2, radius]])
        .on('brush end', () => brushEventHandler(feature.name, event))
      
        brushes[feature.name] = brush;

      const gBrush = svg.append("g")
        .attr("class", "brush")
        .attr("transform", `rotate(${angle * 180 / Math.PI - 180}) translate(0, 0)`)  // Mueve el brush al centro del gráfico

        .call(brush);
    });

    const brushEventHandler = function(feature){
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      if (d3.event.selection != null) {
        filters[feature] = d3.event.selection.map(d => ydomain[feature].invert(d));
      } else {
        if (feature in filters) delete filters[feature];
      }
      const seleccionados = applyFilters();
      setSelectedIds(seleccionados);
    }

    const applyFilters = function(){

      var seleccionados = [];
      d3.select('g.active').selectAll('path')
      .style('display', function(d,i){
        if(selected(d)){
          seleccionados.push(i);
          return null;
        }
        else {
          return 'none';
        }
      })

      return seleccionados;
    }

    function selected(d) {
      return Object.entries(filters).every(([key, [min, max]]) => {
        return min <= d[key] && d[key] <= max;
      });
    }
    
  }

  const dropdownId = `${id}-dropdown`;

  return (
    <div>
      <div className={"configuration"} style={{display:"flex"}}>
        <p> select axis:</p>
        <DropdownMultiselect
          id={dropdownId}
          name={dropdownId}
          className="dropdown-up"
          options={identifiersOptions} // identifiersOptions to display in the dropdown
          handleOnChange={onSelect}
        />
      </div>
      <svg id={id}></svg>
    </div>
  );
}
