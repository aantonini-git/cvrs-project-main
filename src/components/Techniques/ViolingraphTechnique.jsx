import { useEffect, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx"; 

import DropdownButton from 'react-bootstrap/DropdownButton';
import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
import Dropdown from 'react-bootstrap/Dropdown';
import './Styles/BoxgraphStyles.css';
import * as d3 from "d3";
import { configuration_options } from "../ConfigureTechniques/configuration.js";

export default function ViolinGraphTechnique({ id, iddiv, userConfigArray, flag }) {
 
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

  const [identifiersOptions, setIdentifiersOptions] = useState(
    identifiersList.map((label, i) => ({ label, key: i }))
  );  
  const [selectedList, setSelectedList] = useState([]);
  const [category, setCategory] = useState("");
  const [axesType, setAxesType] = useState("Unstructured"); 
  const [axesOrientation, setAxesOrientation] = useState("Orthogonal");

  useEffect(() => {
    updateSelectedData();
  }, [selectedIds, selectedCategory]);

  useEffect(() => {
    if(selectedList.length>0){
        if(axesType==='Unstructured')
          drawChartUnstructured();
        else{
          if(axesOrientation==='Orthogonal')
            drawChartOrthogonal();
          else
            if(axesOrientation==='Parallel')
              drawChart();
            else
              drawRadialChart();
      }
    }
  }, [axesType,axesOrientation,selectedList,flag]);

  useEffect(() => {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 50, bottom: 40, left: 40},
    width = document.getElementById(''+iddiv).offsetWidth - margin.left - margin.right,
    height = document.getElementById(''+iddiv).offsetHeight- document.getElementById(''+iddiv).offsetHeight/4- margin.top - margin.bottom;

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


    const idUnstructured = configuration_options.find(opt => opt.label === "Unstructured")?.bit; 
    const idQuantitative = configuration_options.find(opt => opt.label === "Quantitative")?.bit; 

    const idOrthogonal = configuration_options.find(opt => opt.label === "Orthogonal")?.bit; 
    const idParallel = configuration_options.find(opt => opt.label === "Parallel")?.bit; 
    const idRadial = configuration_options.find(opt => opt.label === "Radial")?.bit; 

    var axesType;
    (userConfigArray[idUnstructured]==1  && userConfigArray[idQuantitative]==0)?axesType='Unstructured':axesType='Quantitative';
    if(axesType==='Unstructured'){
      setAxesType("Unstructured");
    }
    else {
      setAxesType("Quantitative");

      if(userConfigArray[idOrthogonal]==1){
        setAxesOrientation("Orthogonal");
      }
      else {
        if(userConfigArray[idParallel]==1){
          setAxesOrientation("Parallel");
        }
        else {
          if(userConfigArray[idRadial]==1){
            setAxesOrientation("Radial");
          }
          else {
            setAxesOrientation("Orthogonal");
          }
        }
      }
    }
  }, [userConfigArray]);

  function onSelect(selectedList) {
 
    const result = identifiersOptions
      .filter(item => selectedList.includes(item.key.toString())) // filtrar solo los que estén en selectedKeys
      .map(item => ({
        name: item.label,
        id: Number(item.key) // convertir a número
    }));

    var aux = [];
    result.forEach((element) => aux.push(element.name));

    setSelectedList(aux)
  }

  function drawChart() {

    // ───────── DIMENSIONES
    const margin = { top: 20, right: 50, bottom: 40, left: 40 };
    const width =
      document.getElementById(iddiv).offsetWidth -
      margin.left -
      margin.right;
    const height =
      document.getElementById(iddiv).offsetHeight -
      document.getElementById(iddiv).offsetHeight / 4 -
      margin.top -
      margin.bottom;

    d3.select("#" + id).selectAll("*").remove();

    const svg = d3
      .select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const labels = selectedList || [];

    let categories = [];
    if (selectedCategory && Array.isArray(categoricalData)) {
      categories = Array.from(
        new Set(categoricalData.map(d => d[selectedCategory]))
      );
    }

    // ───────── KDE HELPERS
    function kernelDensityEstimator(kernel, X) {
      return function (V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
      };
    }

    function kernelEpanechnikov(k) {
      return function (v) {
        v /= k;
        return Math.abs(v) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
      };
    }

    // ───────── ESCALAS
    const x0 = d3
      .scaleBand()
      .domain(labels)
      .range([0, width])
      .padding(0.3);

    const allValues = data
      .flatMap(d => labels.map(l => +d[l]))
      .filter(v => !isNaN(v));

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(allValues))
      .nice()
      .range([height, 0]);

    const color = categories.length
      ? d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10)
      : () => "#4e73df";

    // ───────── EJES
    svg.append("g").call(d3.axisLeft(yScale));
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    // ───────── VIOLINES
    labels.forEach(label => {
      const gLabel = svg
        .append("g")
        .attr("transform", `translate(${x0(label)},0)`);

      const values = data
        .map(d => +d[label])
        .filter(v => !isNaN(v));

      if (!values.length) return;

      const sorted = values.slice().sort(d3.ascending);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const q1 = d3.quantile(sorted, 0.25);
      const med = d3.quantile(sorted, 0.5);
      const q3 = d3.quantile(sorted, 0.75);

      const ticks = d3
        .scaleLinear()
        .domain([min, max])
        .ticks(40);

      const kde = kernelDensityEstimator(
        kernelEpanechnikov((max - min) / 25),
        ticks
      );

      const density = kde(values);
      const maxDensity = d3.max(density, d => d[1]);

      const centerX = x0.bandwidth() / 2;
      const halfWidth = x0.bandwidth() * 0.4;

      const xNum = d3
        .scaleLinear()
        .domain([0, maxDensity || 1])
        .range([0, halfWidth]);

      const area = d3
        .area()
        .x0(d => centerX - xNum(d[1]))
        .x1(d => centerX + xNum(d[1]))
        .y(d => yScale(d[0]))
        .curve(d3.curveCatmullRom);

      gLabel
        .append("path")
        .datum(density)
        .attr("d", area)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("opacity", 0.6);

      gLabel
          .append("line")
          .attr("x1", centerX - halfWidth)
          .attr("x2", centerX + halfWidth)
          .attr("y1", yScale(min))
          .attr("y2", yScale(min))
          .attr("stroke", "black")
          .attr("stroke-dasharray", "3,2");

      gLabel.append("text")
        .attr("x", centerX)
        .attr("y", yScale(min)+14)
        .attr("dy", "-0.5em")
        .style("font-size", "10px")
        .text(d => `Min: ${min}`);

      gLabel
          .append("line")
          .attr("x1", centerX - halfWidth)
          .attr("x2", centerX + halfWidth)
          .attr("y1", yScale(med))
          .attr("y2", yScale(med))
          .attr("stroke", "black")
          .attr("stroke-dasharray", "0");

      gLabel.append("text")
        .attr("x", centerX + halfWidth)
        .attr("y", yScale(med))
        .attr("dy", "-0.5em")
        .style("font-size", "10px")
        .text(d => `Med: ${med}`);

      gLabel
          .append("line")
          .attr("x1", centerX - halfWidth)
          .attr("x2", centerX + halfWidth)
          .attr("y1", yScale(max))
          .attr("y2", yScale(max))
          .attr("stroke", "black")
          .attr("stroke-dasharray", "3,2");

      gLabel.append("text")
        .attr("x", centerX + halfWidth)
        .attr("y", yScale(max))
        .attr("dy", "-0.5em")
        .style("font-size", "10px")
        .text(d => `Max: ${max}`);

      [q1, q3].forEach(v => {
        gLabel
          .append("line")
          .attr("x1", centerX - halfWidth)
          .attr("x2", centerX + halfWidth)
          .attr("y1", yScale(v))
          .attr("y2", yScale(v))
          .attr("stroke", "black")
          .attr("stroke-dasharray", "3,2");
      });
    });

    // ───────── COORDENADAS PARALELAS
    const line = d3
      .line()
      .x(d => x0(d.label) + x0.bandwidth() / 2)
      .y(d => yScale(d.value));

    const pathGroup = svg
      .append("g")
      .attr("class", "parallel-lines");

    pathGroup
      .selectAll("path")
      .attr("class", "lines")
      .data(data)
      .enter()
      .append("path")
      .attr("d", d => {
        const lineData = labels
          .map(label => ({
            label,
            value: +d[label]
          }))
          .filter(e => !isNaN(e.value));

        return line(lineData);
      })
      .attr("fill", "none")
      .attr("stroke", (d, i) =>
        categories.length
          ? color(categoricalData[i][selectedCategory])
          : "#4e73df"
      )
      .attr("stroke-width", 0.5)

    // ───────── BRUSHING
    const brushGroup = svg.append("g").attr("class", "brushes");

    const selections = {};

    const brush = d3
      .brushY()
      .extent([
        [-x0.bandwidth() / 2, 0],
        [x0.bandwidth() / 2, height]
      ])
      .on("end", brushed);

    labels.forEach(label => {
      brushGroup
        .append("g")
        .attr("class", "brush")
        .attr("data-label", label)
        .attr(
          "transform",
          `translate(${x0(label) + x0.bandwidth() / 2},0)`
        )
        .call(brush);
    });

    function brushed(event) {
      const selection = d3.event.selection;
      const label = d3.select(this).attr("data-label");

      if (!selection) {
        delete selections[label];
      } else {
        const [y0, y1] = selection;
        selections[label] = { y0, y1 };
      }

      var selectedIndices = updatePaths();
      setSelectedIds(selectedIndices);
    }


    function updatePaths() {
      var seleccionados = [];

      if (!d3.event.selection) {
        pathGroup.selectAll("path")
          .style("stroke", (d, i) =>
            selectedCategory != null
              ? color(categoricalData[i][selectedCategory])
              : "#4e73df");
            return [];
      }

      pathGroup.selectAll("path")
        .style("stroke", function(d, i) {
          const ok = Object.keys(selections).every(label => {
            const { y0, y1 } = selections[label];
            const v = +d[label];
            if (isNaN(v)) return false;
            const y = yScale(v);
            return y >= y0 && y <= y1;
          });
          if (ok) seleccionados.push(i);
            return ok ? color(categoricalData[i][selectedCategory]) : "grey";
      });

      return seleccionados;
    }
  }


  function drawChartOrthogonal() {

    const margin = { top: 60, right: 60, bottom: 80, left: 60 };
    const container = document.getElementById(iddiv);

    const width = container.offsetWidth - margin.left - margin.right;
    const height =
      container.offsetHeight -
      container.offsetHeight / 4 -
      margin.top -
      margin.bottom;

    d3.select("#" + id).selectAll("*").remove();

    const svg = d3.select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const labels = selectedList || [];

    let categories = [];
    if (selectedCategory && Array.isArray(categoricalData)) {
      categories = Array.from(new Set(
        categoricalData.map(d => d[selectedCategory])
      ));
    }

    // ───────── KDE helpers
    function kernelDensityEstimator(kernel, X) {
      return function (V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
      };
    }

    function kernelEpanechnikov(k) {
      return function (v) {
        v /= k;
        return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }

    // ───────── Escalas X
    const x0 = d3.scaleBand()
      .domain(labels)
      .range([0, width])
      .padding(0.3);

    const x1 = categories.length
      ? d3.scaleBand()
          .domain(categories)
          .range([0, x0.bandwidth()])
          .padding(0.6)
      : null;

    // ───────── Escala Y global
    const allValues = data
      .flatMap(d => labels.map(l => +d[l]))
      .filter(v => !isNaN(v));

    const yScale = d3.scaleLinear()
      .domain(d3.extent(allValues))
      .nice()
      .range([height, 0]);

    const color = categories.length
      ? d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10)
      : () => "#4e73df";

    // ───────── Ejes
    svg.append("g").call(d3.axisLeft(yScale));
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    // ───────── VIOLINES
    labels.forEach(label => {
      const gLabel = svg.append("g")
        .attr("transform", `translate(${x0(label)},0)`);

      const cats = categories.length ? categories : ["_all_"];

      cats.forEach(cat => {

        const values = data
          .map((d, i) => {
            const v = +d[label];
            const c = categoricalData?.[i]?.[selectedCategory];
            return (!isNaN(v) && (!categories.length || c === cat)) ? v : null;
          })
          .filter(v => v !== null);

        if (!values.length) return;

        const sorted = values.slice().sort(d3.ascending);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const q1 = d3.quantile(sorted, 0.25);
        const med = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);

        const ticks = d3.scaleLinear()
          .domain([min, max])
          .ticks(40);

        const kde = kernelDensityEstimator(
          kernelEpanechnikov((max - min) / 25),
          ticks
        );

        const density = kde(values);
        const maxDensity = d3.max(density, d => d[1]);

        const centerX = categories.length
          ? x1(cat) + x1.bandwidth() / 2
          : x0.bandwidth() / 2;

        const band = categories.length ? x1.bandwidth() : x0.bandwidth();
        const halfWidth = band * 0.4;

        const xNum = d3.scaleLinear()
          .domain([0, maxDensity || 1])
          .range([0, halfWidth]);

        const area = d3.area()
          .x0(d => centerX - xNum(d[1]))
          .x1(d => centerX + xNum(d[1]))
          .y(d => yScale(d[0]))
          .curve(d3.curveCatmullRom);

        gLabel.append("path")
          .datum(density)
          .attr("d", area)
          .attr("fill", color(cat))
          .attr("stroke", "black")
          .attr("opacity", 0.6);

        [min, q1, med, q3, max].forEach(v => {
          gLabel.append("line")
            .attr("x1", centerX - halfWidth)
            .attr("x2", centerX + halfWidth)
            .attr("y1", yScale(v))
            .attr("y2", yScale(v))
            .attr("stroke", "black")
            .attr("stroke-dasharray", v === med ? "0" : "3,2");
        });
      });
    });
  }

  function drawChartUnstructured() {

    const margin = { top: 60, right: 40, bottom: 40, left: 40 };
    const container = document.getElementById(iddiv);

    const width = container.offsetWidth - margin.left - margin.right;
    const height = container.offsetHeight - container.offsetHeight / 4 - margin.top - margin.bottom;

    d3.select("#" + id).selectAll("*").remove();

    const svg = d3.select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const labels = selectedList || [];

    let categories = null;
    if (selectedCategory && Array.isArray(categoricalData)) {
      categories = Array.from(
        new Set(categoricalData.map(d => d[selectedCategory]))
      );
    }

    const color = categories
      ? d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10)
      : () => "#4e73df";

    function kernelDensityEstimator(kernel, X) {
      return function (V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
      };
    }

    function kernelEpanechnikov(k) {
      return function (v) {
        v /= k;
        return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }

    const widthBox = width / (labels.length || 1);

    labels.forEach((label, colIndex) => {

      const allValues = data
        .map(d => +d[label])
        .filter(v => !isNaN(v));

      if (allValues.length === 0) return;

      const minGlobal = d3.min(allValues);
      const maxGlobal = d3.max(allValues);

      const yScale = d3.scaleLinear()
        .domain([minGlobal, maxGlobal])
        .range([height, 0])
        .nice();

      const gCol = svg.append("g")
        .attr("transform", `translate(${colIndex * widthBox},0)`);

      const cats = categories || ["_all_"];

      const xCat = d3.scaleBand()
        .domain(cats)
        .range([0, widthBox])
        .paddingInner(0.6)
        .paddingOuter(0.4);

      const ticks = yScale.ticks(50);
      const kde = kernelDensityEstimator(
        kernelEpanechnikov((maxGlobal - minGlobal) / 25),
        ticks
      );

      cats.forEach(cat => {

        const values = data
          .map((d, i) => {
            const v = +d[label];
            const c = categoricalData?.[i]?.[selectedCategory];
            return (!isNaN(v) && (!categories || c === cat)) ? v : null;
          })
          .filter(v => v !== null);

        if (values.length === 0) return;

        const sorted = values.slice().sort(d3.ascending);

        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);

        const density = kde(values);
        const maxDensity = d3.max(density, d => d[1]);

        // ─────────────────────────────────────────
        // VIOLINES MÁS FINOS
        // ─────────────────────────────────────────
        const violinWidthFactor = 0.6; // ← ajustable
        const halfWidth = (xCat.bandwidth() * violinWidthFactor) / 2;

        const xNum = d3.scaleLinear()
          .domain([0, maxDensity || 1])
          .range([0, halfWidth]);

        const center = xCat(cat) + xCat.bandwidth() / 2;

        const area = d3.area()
          .x0(d => center - xNum(d[1]))
          .x1(d => center + xNum(d[1]))
          .y(d => yScale(d[0]))
          .curve(d3.curveCatmullRom);

        gCol.append("path")
          .datum(density)
          .attr("d", area)
          .attr("fill", color(cat))
          .attr("stroke", "black")
          .attr("opacity", 0.65);

        const stats = [
          { label: "Min", value: min },
          { label: "Q1", value: q1 },
          { label: "Median", value: median },
          { label: "Q3", value: q3 },
          { label: "Max", value: max }
        ];

        stats.forEach(s => {
          const y = yScale(s.value);

          gCol.append("line")
            .attr("x1", center - halfWidth)
            .attr("x2", center + halfWidth)
            .attr("y1", y)
            .attr("y2", y)
            .attr("stroke", "black")
            .attr("stroke-dasharray", s.label === "Median" ? "0" : "3,2");

          gCol.append("text")
            .attr("x", center + halfWidth + 4)
            .attr("y", y + 3)
            .style("font-size", "10px")
            .text(`${s.label}: ${s.value.toFixed(2)}`);
        });

      });

      gCol.append("text")
        .attr("x", widthBox / 2)
        .attr("y", height + 25)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(label);
    });
  }

function drawRadialChart() {
  
  var margin = { top: 40, right: 40, bottom: 40, left: 40 };
  var width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
  var height = document.getElementById(iddiv).offsetHeight - document.getElementById(iddiv).offsetHeight / 8 - margin.top - margin.bottom;
  var radius = Math.min(width, height) / 2;

  d3.select("#" + id).select("g").selectAll("*").remove();

  var svg = d3.select("#" + id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .select("g")
    .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

  const labels = selectedList || [];

  let categories = null;
  if (selectedCategory && Array.isArray(categoricalData)) {
    categories = Array.from(new Set(categoricalData.map(d => d[selectedCategory])));
  }

  let color = d3.scaleOrdinal(d3.schemeCategory10);
  if (categories.length > 0) {
    color = d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10);
  }

  const angleSlice = (2 * Math.PI) / labels.length;

  /* =========================
     KDE (Violin)
  ========================== */
  // Función para el estimador de densidad (Kernel Density Estimator)
  function kernelDensityEstimator(kernel, X) {
    return function (V) {
      return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
  }

  // Función para el kernel Epanechnikov
  function kernelEpanechnikov(k) {
    return function (v) {
      v /= k;
      return Math.abs(v) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
    };
  }

  /* =========================
     Datos del violín
  ========================== */
  const violinData = labels.map(label => {

    const values = data.map(d => d[label]).filter(v => v != null);

    const min = d3.min(values);
    const max = d3.max(values);

    const rScale = d3.scaleLinear()
      .domain([min, max])
      .range([30, radius]);

    const ticks = rScale.ticks(40);
   
    const kde = kernelDensityEstimator(kernelEpanechnikov((max - min) / 25), ticks);

    const density = kde(values);
    const maxDensity = d3.max(density, d => d[1]);

    return {
      label,
      min,
      max,
      density: kde(values)
    };
  });

  /* =========================
     Dibujar violín radial
  ========================== */
  function drawViolin(g, d, angle, rScale) {

    g.attr("transform", `rotate(${angle * 180 / Math.PI})`);

    const widthScale = d3.scaleLinear()
      .domain([0, d3.max(d.density, v => v[1])])
      .range([0, 20]);

    const area = d3.area()
      .x0(v => -widthScale(v[1]))
      .x1(v => widthScale(v[1]))
      .y(v => rScale(v[0]))
      .curve(d3.curveCatmullRom);

    g.append("path")
      .datum(d.density)
      .attr("fill", "white")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.85)
      .attr("d", area);

    // Etiqueta del eje
    g.append("text")
      .attr("y", rScale(d.max) + 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d.label);
  }

  /* =========================
     Dibujar todos los violines
  ========================== */
  svg.selectAll(".violin")
    .data(violinData)
    .enter()
    .append("g")
    .attr("class", "violin")
    .each(function (d, i) {

      const rScale = d3.scaleLinear()
        .domain([d.min, d.max])
        .range([30, radius]);

      drawViolin(d3.select(this), d, i * angleSlice, rScale);
    });

  //Líneas paralelas radiales
  const drawParallelCoordinates = () => {

    const line = d3.lineRadial()
      .angle((d, i) => i * angleSlice + Math.PI)
      .radius(d => {
        const scale = d3.scaleLinear()
          .domain([
            d3.min(data.map(e => e[d.label])),
            d3.max(data.map(e => e[d.label]))
          ])
          .range([30, radius]);
        return scale(d.value);
      });

    // Grupo para las líneas de coordenadas paralelas
    const pathGroup = svg.append("g").attr("class", "parallel-lines");

    data.forEach((datum, i) => {

      const lineData = labels.map(label => ({
        label,
        value: datum[label],
        color: categoricalData[datum.index][selectedCategory]
      }));

      //lineData.index = i;
      lineData.push(lineData[0]);

      const wrappedData = {
        values: lineData,
        index: i
      };

      pathGroup.append("path")
        .attr("class", "lines")
        //.datum(lineData)
        .datum(wrappedData)
        .attr("fill", "none")
        //.attr("stroke", color(lineData[0].color))
        .attr("stroke-width", 0.5)
        .style("opacity", 0.5)
        //.attr("d", line)
        .attr("d", d => line(d.values))
        .attr("stroke", color(categoricalData[i][selectedCategory]))
    });

    return pathGroup;  // Devolvemos pathGroup para su acceso en la función `updatePaths`
  };

  // Obtener el grupo de caminos de coordenadas paralelas
  const pathGroup = drawParallelCoordinates();

  /* =========================
     Ejes y brushing
  ========================== */
  const brush = d3.brushY()
    .extent([[-10, 0], [10, radius]])
    .on("end", brushed);

  const axes = svg.selectAll(".axis")
    .data(labels)
    .enter()
    .append("g")
    .attr("class", "axis")
    .attr("data-label", d => d)
    .attr("transform", (d, i) => `rotate(${i * angleSlice * 180 / Math.PI})`);

  axes.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", radius)
    .attr("stroke", "black");

  axes.call(brush);

  const selections = {};

  function brushed(event) {

    const brushSelection = d3.event.selection;
    const label = d3.select(this).attr("data-label");

    if (!brushSelection) {
      delete selections[label];
    } else {

      const [y0, y1] = brushSelection;

      const scale = d3.scaleLinear()
        .domain([30, radius])
        .range([
          d3.min(data.map(d => d[label])),
          d3.max(data.map(d => d[label]))
        ]);

      selections[label] = {
        minValue: scale(y0),
        maxValue: scale(y1)
      };
    }

    var selectedIndices = updatePaths(pathGroup);
    setSelectedIds(selectedIndices);
  }

  
  function updatePaths() {
    var seleccionados = [];

    if (!d3.event.selection) {
      pathGroup.selectAll("path")
        .style("stroke", (d, i) =>
          selectedCategory != null
            ? color(categoricalData[i][selectedCategory])
            : "#4e73df");
      return [];
    }

    pathGroup.selectAll("path")
      .style("stroke", function(d, i) {
        const ok = Object.keys(selections).every(label => {
          const { minValue, maxValue } = selections[label];
          return data[i][label] >= minValue && data[i][label] <= maxValue;
        });

        if (ok) seleccionados.push(i);
        return ok ? color(categoricalData[i][selectedCategory]) : "grey";
      });

      return seleccionados;
    }
  }

  function updateSelectedData(){

    var svg = d3.select("#" + id);
    var lines = svg.select("g").select(".parallel-lines");
        
    let categories = [];
    if (selectedCategory && Array.isArray(categoricalData)) {
      categories = Array.from(new Set(categoricalData.map(d => d[selectedCategory])));
    }
        
    // Escala de colores
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    if (categories.length > 0) {
      color = d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10);
    }
                  
    lines.selectAll("path")
      .style("stroke", function(d) {
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
      }) 
    }

  function selectAxesType(evt){
    let axes = evt.toString();
    setAxesType(axes);
  }

  function selectAxesOrientation(evt){
    let orientation = evt.toString();
    setAxesOrientation(orientation);
  }

  function selectCategory(evt){
    let cat = evt.toString();
    setCategory(cat);
  }
  
  const dropdownId = `${id}-dropdown`;
 
  return (
    <div>
      <div className={"configuration"} style={{display:"flex"}}>
        <p> axes-type:</p>
        <div className="dropdown-option" style={{display:"flex"}}>
          <DropdownButton title={axesType} id={"btn-axisx"} onSelect={(e) => selectAxesType(e)}>
            <Dropdown.Item id={"axest0"} key={"Unstructured"} eventKey={"Unstructured"}>
              Unstructured
            </Dropdown.Item>
            <Dropdown.Item id={"axest1"} key={"Quantitative"} eventKey={"Quantitative"}>
              Quantitative
            </Dropdown.Item>
          </DropdownButton>
        </div>

        <p> axes-orientation:</p>
        <div className="dropdown-option" style={{display:"flex"}}>
          <DropdownButton disabled={axesType==='Quantitative' ? false : true} title={axesOrientation} id={"btn-axisx"} onSelect={(e) => selectAxesOrientation(e)}>
            <Dropdown.Item id={"axeso0"} key={"Orthogonal"} eventKey={"Orthogonal"}>
              Orthogonal
            </Dropdown.Item>
            <Dropdown.Item id={"axeso1"} key={"Parallel"} eventKey={"Parallel"}>
              Parallel
            </Dropdown.Item>
            <Dropdown.Item id={"axeso2"} key={"Radial"} eventKey={"Radial"}>
              Radial
            </Dropdown.Item>
          </DropdownButton>
        </div>
      </div>

      <div className="configuration dropdown-option" style={{display:"flex", marginTop:"10px"}}>
        <p> select axis:</p>
        <DropdownMultiselect
          id={dropdownId}
          name={dropdownId}
          className="dropdown-up"
          options={identifiersOptions} 
          handleOnChange={(selected) => {
            if (selectCategory !== null) {
              if(selectedList.length<1)
                onSelect(selected)
              else{
                setSelectedList([]);
                onSelect(selected)
              }
            } else {
              onSelect(selected);
            }
          }}
        />
      </div>
      <svg id={id}></svg>
    </div>
  );
}