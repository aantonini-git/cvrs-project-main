import { useEffect, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx";

import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
//https://www.npmjs.com/package/react-multiselect-dropdown-bootstrap
import * as d3 from "d3";
import './Styles/ParallelCoordinatesStyles.css';

export default function ParallelCoordinatesTechnique({ id, iddiv, userConfigArray, flag}) {
 
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

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

  useEffect(() => {
    updateSelectedData();
  }, [selectedIds]);

  useEffect(()=>{
      let children = [];

      for(let i = 0; i<identifiersList.length; i++){
        children.push({label:identifiersList[i] , key:i});
      }

      setIdentifiersOptions(children);
  },[data]);

  function updateSelectedData(){
    d3.select("#"+id).select('g.active').selectAll('path')
    .style('display', function(d,i){
      if(selectedIds.length==0 || selectedIds.includes(i)){
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

    d3.select("#" + id).selectAll("*").remove()

    // set the dimensions and margins of the graph
    var margin = {top: 50, right: 50, bottom: 50, left: 40};
    const width = document.getElementById(''+iddiv).offsetWidth - margin.left - margin.right,
    height = document.getElementById(''+iddiv).offsetHeight - margin.top - margin.bottom,
    padding = 35, brush_width = 20;

    var datad = [];
    data.forEach((item, i) => {
      const element = {};
      selectedList.forEach((item1, i1) => {
        /*Object.defineProperty(element, this.state.labels[item1], {
        value: item[this.state.labels[item1]],
      });*/
      element[item1.name] = item[item1.name]
      //element['index'] = item.index;
      element['color'] = categoricalData[i][selectedCategory];
    });
    datad.push(element);
  });

  if(selectedList.length>0){
    const features = [];
    selectedList.forEach((item, i) => {
      features.push({name: item.name, range: [d3.extent(datad.map(l=>l[item.name]))[0],d3.extent(datad.map(l=>l[item.name]))[1]]})
    });

    const filters = {};

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    if (selectedCategory != null) {
      const uniqueCategories = [...new Set(datad.map(d => d['color']))];
      color = d3.scaleOrdinal()
        .domain(uniqueCategories)
        .range(d3.schemeCategory10);
    }

    // Horizontal scale
    const xScale = d3.scalePoint()
    .domain(features.map(x=>x.name))
    .range([padding, width-padding]);

    // Each vertical scale
    const yScales = {};
    features.map(x=>{
      yScales[x.name] = d3.scaleLinear()
      .domain(x.range)
      .range([height-padding, padding]);
    });
    

    // Each axis generator
    const yAxis = {};
    d3.entries(yScales).map(x=>{
      yAxis[x.key] = d3.axisLeft(x.value);
    });

    // Each brush generator

    const brushEventHandler = function(feature){
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom")
      return; // ignore brush-by-zoom
      if(d3.event.selection != null){
        filters[feature] = d3.event.selection.map(d=>yScales[feature].invert(d));
      }else{
        if(feature in filters)
        delete(filters[feature]);
      }
      var seleccionados = applyFilters();
      setSelectedIds(seleccionados);
    }

    const applyFilters = function(){

      var seleccionados = [];
      d3.select("#"+id).select('g.active').selectAll('path')
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

    const selected = function(d){
      const _filters = d3.entries(filters);
      return _filters.every(f=>{
        return f.value[1] <= d[f.key] && d[f.key] <= f.value[0];
      });
    }

    const yBrushes = {};
    d3.entries(yScales).map(x=>{
      let extent = [
        [-(brush_width/2), padding],
        [brush_width/2, height-padding]
      ];
      yBrushes[x.key]= d3.brushY()
      .extent(extent)
      .on('brush', ()=>brushEventHandler(x.key))
      .on('end', ()=>brushEventHandler(x.key));
    });


    // Paths for data
    const lineGenerator = d3.line();

    const linePath = function(d){
      return lineGenerator(
        features.map(f => [xScale(f.name), yScales[f.name](d[f.name])])
      );
    }

    const pcSvg = d3
      .select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    
    // Inactive data
    pcSvg.append('g').attr('class','inactive').selectAll('path')
    .data(datad)
    .enter()
    .append('path')
    .attr('d', d=>linePath(d));

    // Active data
    pcSvg.append('g').attr('class','active').selectAll('path')
    .data(datad)
    .enter()
    .append('path')
    .attr('d', d=>linePath(d))
    .style("stroke", d => selectedCategory!=null? color(d['color']): "#4E73DF");

    // Vertical axis for the features
    const featureAxisG = pcSvg.selectAll('g.feature')
    .data(features)
    .enter()
    .append('g')
    .attr('class','feature')
    .attr('transform',d=>('translate('+xScale(d.name)+',0)'));

    featureAxisG
    .append('g')
    .each(function(d){
      d3.select(this).call(yAxis[d.name]);
    });

    featureAxisG
    .each(function(d){
      d3.select(this)
      .append('g')
      .attr('class','brush')
      .call(yBrushes[d.name]);
    });

    featureAxisG
    .append("text")
    .attr("text-anchor", "middle")
    .attr('y', padding/2)
    .text(d=>d.name)

    if (selectedCategory != null) {
      // Crear contenedor para la leyenda
      var legend = pcSvg.append('g')
      .attr('transform', `translate(${width - 100}, 20)`); // Posicionar leyenda

      // Definir los grupos de leyenda
      const categories = [...new Set(datad.map(d => d.color))];
    
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
