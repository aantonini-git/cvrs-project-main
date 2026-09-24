import { useEffect, useContext, useState } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
//https://www.npmjs.com/package/react-multiselect-dropdown-bootstrap
import * as d3 from "d3";
import './Styles/SPLOMStyles.css';

export default function SPLOMTechnique({ id, iddiv, userConfigArray, flag }) {
 
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);
  
  const [identifiersOptions, setIdentifiersOptions] = useState(
    identifiersList.map((label, i) => ({ label, key: i }))
  );
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    updateOptions();
  }, [identifiersList]);

  useEffect(() => {
      updateSelectedData();
  }, [selectedIds, selectedCategory]);


  useEffect(() => {
    drawChart(selectedOptions);
  }, [data, flag]);

  function updateSelectedData() {
    var svg = d3.select("#" + id).select("g");

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

    svg.selectAll("circle").style("fill", function(d, i) {
        // Si el índice está seleccionado, aplica un color fuerte
        if (selectedIds.includes(d.index)) {
            return selectedCategory !== null
                ? color(categoricalData[d.index][selectedCategory]) // Color específico para especies (cuando selectedCategory no es null)
                : "#4E73DF";  // Color por defecto si no hay categoría seleccionada
        }

        // Si no hay selecciones, aplica el color por defecto a todas
        if (selectedIds.length === 0) {
            return selectedCategory !== null
                ? color(categoricalData[d.index][selectedCategory]) // Si hay una categoría seleccionada, usa rojo para los no seleccionados
                : "#4E73DF"; // Color por defecto para todos cuando no hay selecciones
        }

        // Si no está seleccionado, aplica un color desactivado (transparente)
        return "rgba(0,0,0,0.2)"; // Círculos no seleccionados en color gris
    });
}

  function updateOptions(){
    let children = [];

    for(let i = 0; i<identifiersList.length; i++){
      children.push({label: identifiersList[i] , key:i});
    }

    setIdentifiersOptions(children)
  }

  function drawChart(selectedOptions){
    if(identifiersOptions.length==0) updateOptions();
    d3.select("#"+id).selectAll("*").remove()

    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 50, left: 20},
    width = document.getElementById(''+iddiv).offsetWidth == 0? 550 : document.getElementById(''+iddiv).offsetWidth - margin.right - margin.left,
    height = document.getElementById(''+iddiv).offsetHeight == 0? 350 :  document.getElementById(''+iddiv).offsetHeight - margin.bottom - margin.top;


    var n = selectedOptions.length;
    var size = (height - margin.top - margin.bottom) / n ,
    padding = 10;

    var x = d3.scaleLinear()
    .range([padding / 2, size - padding / 2]);

    var y = d3.scaleLinear()
    .range([size - padding / 2, padding / 2]);

    var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(5).tickFormat(d3.format(".1f")) ;

    var yAxis = d3.axisLeft()
    .scale(y)
    .ticks(5).tickFormat(d3.format(".1f")) ;

    var dataAux = [];
    data.forEach((item, i) => {
      const element = {};
      selectedOptions.forEach((item1, i1) => {
        /*Object.defineProperty(element, this.state.labels[item1], {
        value: item[this.state.labels[item1]],
      });*/
      element[item1.name] = item[item1.name]
      element['index'] = item.index;
      element['color'] = categoricalData[i][selectedCategory];
    });
    dataAux.push(element);
  });

  
  if(selectedOptions.length>0){
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    
    if(selectedCategory!=null){
      // Define the color scale.
      color = d3.scaleOrdinal()
      .domain(dataAux.map(d => d['color']))
      .range(d3.schemeCategory10);
    }

    var domainByTrait = {},
    traits = d3.keys(dataAux[0]).filter(function(d) { return d !== "index" && d !== "color"; });
    n = traits.length;
    traits.forEach(function(trait) {
      domainByTrait[trait] = d3.extent(dataAux, function(d) { return d[trait]; });
    });


    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    var brush = d3.brush()
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend)
    .extent([[0,0],[size,size]]);


    var svg = d3.select("#"+id)
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");


    if (selectedCategory != null) {
      // Crear contenedor para la leyenda
      var legend = svg.append('g')
      .attr('transform', 'translate(' + (width + margin.right - 120) + ', 20)'); // Posicionar leyenda

      // Definir los grupos de leyenda
      var categories = Array.from(new Set(dataAux.map(d => d['color'])));
    
      legend.selectAll('rect')
      .data(categories)
      .enter()
      .append('rect')
      .attr('x', -15)
      .attr('y', (d, i) => i * 20)
      .attr('width', 18)
      .attr('height', 18)
      .style("fill", d => color(d));

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

    svg.selectAll(".x.axis")
    .data(traits)
    .enter().append("g")
    .attr("class", "x axis")
    .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
    .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

    svg.selectAll(".y.axis")
    .data(traits)
    .enter().append("g")
    .attr("class", "y axis")
    .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
    .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

    var cell = svg.selectAll(".cell")
    .data(cross(traits, traits))
    .enter().append("g")
    .attr("class", "cell")
    .attr("width", size)
    .attr("height", size)
    .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
    .each(plot);

    // Titles for the diagonal.
    cell.filter(function(d) { return d.i === d.j; }).append("text")
    .attr("x", padding)
    .attr("y", padding)
    .attr("dy", ".71em")
    .text(function(d) { return d.x; });

    cell.call(brush);


    function plot(p) {
      var cell = d3.select(this);

      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);

      
      cell.append("rect")
      .attr("class", "frame")
      .attr("x", padding / 2)
      .attr("y", padding / 2)
      .attr("width", size - padding)
      .attr("height", size - padding);
      
      cell.selectAll("circle")
      .data(dataAux)
      .enter().append("circle")
      .attr("cx", function(d) { return x(d[p.x]); })
      .attr("cy", function(d) { return y(d[p.y]); })
      .attr("r", 2)
      .style("fill", function(d) { return d.color ? color(d['color']) : "#4e73df";});
    }

    var brushCell;

    // Clear the previously-active brush, if any.
    function brushstart(p) {
      if (brushCell !== this) {
        d3.select(brushCell).call(brush.move, null);
        brushCell = this;
        x.domain(domainByTrait[p.x]);
        y.domain(domainByTrait[p.y]);
      }
    }

    // Highlight the selected circles.
    function brushmove(p) {
      var e = d3.brushSelection(this);
      var seleccionados = [];
      svg.selectAll("circle").style("fill", function(d,i) {
        if(!e){
          return color(d['color']);;
        }
        else {
          if(  e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
          || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]){
            return 'lightgrey';
          }
          else {
            if(!seleccionados.includes(d.index)) seleccionados.push(d.index);
            d3.select(this).raise()
            return color(d['color']);
          }
        }
      });



      setSelectedIds(seleccionados);
    }

    // If the brush is empty, select all circles.
    function brushend() {
      var e = d3.brushSelection(this);
      if (e === null) {
        svg.selectAll("circle")
        .style("fill", function(d) {
          // Aquí determina cómo quieres asignar el color cuando el cepillo está vacío
          // Por ejemplo, si tienes una columna 'color' en tus datos:
          setSelectedIds([]);
          return color(d['color']);  // Ajusta esto según cómo estás definiendo 'color'
        });
      }
    }


    function cross(a, b) {
      var c = [], n = a.length, m = b.length, i, j;
      for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
      return c;
    }
  }
  }

  function onSelect(selectedList) {
 
    const result = identifiersOptions
      .filter(item => selectedList.includes(item.key.toString())) // filtrar solo los que estén en selectedKeys
      .map(item => ({
        name: item.label,
        id: Number(item.key) // convertir a número
    }));

    setSelectedOptions(result)
    drawChart(result)
  }

  const dropdownId = `${id}-dropdown`;

  return (
    <div>
      <div className="configuration dropdown-option" style={{display:"flex", marginTop:"10px"}}>
        <p> select axis:</p>
        <DropdownMultiselect
          id={dropdownId}
          name={dropdownId}
          options={identifiersOptions} // Options to display in the dropdown
          handleOnChange={onSelect}
        />
      </div>
      <svg id={id}></svg>
    </div>
  );
}


