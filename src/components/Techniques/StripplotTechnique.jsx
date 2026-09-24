import { useEffect, useState, useContext } from 'react';
import { DataContext } from "../../context/DataContext.jsx"; 

import DropdownButton from "react-bootstrap/DropdownButton";
import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import * as d3 from "d3";
import "./Styles/BoxgraphStyles.css";
import { configuration_options } from "../ConfigureTechniques/configuration.js";

export default function StripplotTechnique({ id, iddiv, userConfigArray, flag }) {
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

  const [identifiersOptions] = useState(
    identifiersList.map((label, i) => ({ label, key: i }))
  );
  const [selectedList, setSelectedList] = useState([]);
  const [axesType, setAxesType] = useState("Unstructured");
  const [axesOrientation, setAxesOrientation] = useState("Orthogonal");

  useEffect(() => {
    const idUnstructured = configuration_options.find(o => o.label === "Unstructured")?.bit;
    const idQuantitative = configuration_options.find(o => o.label === "Quantitative")?.bit;
    const idOrthogonal = configuration_options.find(o => o.label === "Orthogonal")?.bit;
    const idParallel = configuration_options.find(o => o.label === "Parallel")?.bit;

    let type;
    userConfigArray[idUnstructured] === 1 && userConfigArray[idQuantitative] === 0
      ? (type = "Unstructured")
      : (type = "Quantitative");

    setAxesType(type);

    if (type === "Quantitative") {
      if (userConfigArray[idParallel] === 1) 
        setAxesOrientation("Parallel");
      else 
        setAxesOrientation("Orthogonal");
    }
  }, [userConfigArray]);

  useEffect(() => {
    if (!selectedList.length) return;

    if (axesType === "Unstructured") drawStripPlotUnstructured();
    else {
      if (axesOrientation === "Parallel") 
        drawStripPlotParallel();
      else 
        drawStripPlotOrthogonal();
    }
  }, [selectedList, axesType, axesOrientation, flag]);

  useEffect(() => {
    updateSelectedData();
  },[selectedIds, selectedCategory]);

  function onSelect(selectedKeys) {
    const labels = identifiersOptions
      .filter(o => selectedKeys.includes(o.key.toString()))
      .map(o => o.label);
    setSelectedList(labels);
  }

  function drawStripPlotParallel() {
    const margin = { top: 20, right: 50, bottom: 40, left: 40 };
    const width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
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

    const labels = selectedList;

    const categories = selectedCategory
      ? Array.from(new Set(categoricalData.map(d => d[selectedCategory])))
      : [];

    const x0 = d3.scaleBand().domain(labels).range([0, width]).padding(0.4);

    const allValues = data
      .flatMap(d => labels.map(l => +d[l]))
      .filter(v => !isNaN(v));

    const y = d3.scaleLinear().domain(d3.extent(allValues)).nice().range([height, 0]);

    const color = categories.length
      ? d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10)
      : () => "#4e73df";

    svg.append("g").call(d3.axisLeft(y));
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    const jitterMap = {};
    const jitterWidth = x0.bandwidth() * 0.6;

    data.forEach((_, i) => {
      jitterMap[i] = {};
      labels.forEach(label => {
        jitterMap[i][label] = (Math.random() - 0.5) * jitterWidth;
      });
    });

    const pointsGroup = svg.append("g").attr("class", "points");

    labels.forEach(label => {
      const g = pointsGroup.append("g")
        .attr("transform", `translate(${x0(label)},0)`);

      g.selectAll("circle")
        .data(
          data.map((d, i) => ({
            index: i,
            value: +d[label],
            cat: categoricalData?.[i]?.[selectedCategory]
          }))
          .filter(d => !isNaN(d.value))
        )
        .enter()
        .append("circle")
        .attr("cx", d => x0.bandwidth() / 2 + jitterMap[d.index][label])
        .attr("cy", d => y(d.value))
        .attr("r", 2)
        .attr("fill", d => (categories.length ? color(d.cat) : "#4e73df"))
        .attr("opacity", 0.85)
        .attr("data-index", d => d.index);
    });

    const line = d3.line()
      .x(d => d.x)
      .y(d => d.y);

    const linesGroup = svg.append("g")
      .attr("class", "parallel-lines");

    const lines = linesGroup
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", (d, i) => {
        const pts = labels
          .map(label => {
            const v = +d[label];
            if (isNaN(v)) return null;
            return {
              x: x0(label) + x0.bandwidth() / 2 + jitterMap[i][label],
              y: y(v)
            };
          })
          .filter(Boolean);

        return pts.length > 1 ? line(pts) : null;
      })
      .attr("fill", "none")
      .attr("stroke", (d, i) =>
        categories.length
          ? color(categoricalData?.[i]?.[selectedCategory])
          : "#4e73df"
      )
      .attr("data-index", (_, i) => i);

    const activeBrushes = {};

    function brushed(label, event) {
      if (d3.event.selection) {
        const [y0, y1] = d3.event.selection;
        activeBrushes[label] = [y.invert(y1), y.invert(y0)];
      } else {
        delete activeBrushes[label];
      }

      updateVisibility();
    }

    function updateVisibility() {
      const selected = [];

      lines.each(function(d, i) {
        const visible = Object.entries(activeBrushes).every(
          ([label, [min, max]]) => {
            const v = +d[label];
            return !isNaN(v) && v >= min && v <= max;
          }
        );

        if (visible) selected.push(i);
      });

      const selectedSet = new Set(selected);

      lines
        .style("stroke", (d, i) =>
          selectedSet.has(i)
            ? (categories.length
                ? color(categoricalData[i][selectedCategory])
                : "#4e73df")
            : "lightgrey"
        );

      // Traer seleccionadas al frente
      lines
        .filter((d, i) => selectedSet.has(i))
        .raise();

      const points = pointsGroup.selectAll("circle");

      points
        .style("fill", function () {
          const i = +this.getAttribute("data-index");

          return selectedSet.has(i)
            ? (categories.length
                ? color(categoricalData[i][selectedCategory])
                : "#4e73df")
            : "lightgrey";
        });

        // Traer puntos seleccionados al frente
        points
          .filter(function () {
            const i = +this.getAttribute("data-index");
            return selectedSet.has(i);
          })
          .raise();

      setSelectedIds(selected);
    }
        
    labels.forEach(label => {
      const brush = d3.brushY()
        .extent([
          [0, 0],
          [x0.bandwidth(), height]
        ])
        .on("brush end", event => brushed(label, event));

      svg.append("g")
        .attr("class", "brush")
        .attr("transform", `translate(${x0(label)},0)`)
        .call(brush);
    });
  }

  function drawStripPlotOrthogonal() {

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
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

    const labels = selectedList;

    const categories = selectedCategory
      ? Array.from(new Set(categoricalData.map(d => d[selectedCategory])))
      : [];

    const x0 = d3.scaleBand()
      .domain(labels)
      .range([0, width])
      .padding(0.3);

    const allValues = data
      .flatMap(d => labels.map(l => +d[l]))
      .filter(v => !isNaN(v));

    const y = d3.scaleLinear()
      .domain(d3.extent(allValues))
      .nice()
      .range([height, 0]);

    svg.append("g").call(d3.axisLeft(y));

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    const color = categories.length
      ? d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10)
      : () => "#4e73df";

    const pointsGroup = svg.append("g").attr("class", "points");

    const activeBrushes = {};

    labels.forEach(label => {

      const g = pointsGroup.append("g")
        .attr("transform", `translate(${x0(label)},0)`);

      const jitter = x0.bandwidth() * 0.6;

      g.selectAll("circle")
        .data(
          data.map((d, i) => ({
            index: i,
            value: +d[label],
            cat: categoricalData?.[i]?.[selectedCategory],
            label: label
          }))
          .filter(d => !isNaN(d.value))
        )
        .enter()
        .append("circle")
        .attr("cx", d => x0.bandwidth()/2 + (Math.random()-0.5)*jitter)
        .attr("cy", d => y(d.value))
        .attr("r", 2)
        .attr("fill", d =>
          categories.length ? color(d.cat) : "#4e73df"
        )
        .attr("opacity", 0.85)
        .attr("data-index", d => d.index)
        .attr("data-label", d => d.label);
    });

    function brushed(label, event) {

      if (!d3.event.selection) {
        delete activeBrushes[label];
      } else {
        const [y0, y1] = d3.event.selection;

        const v0 = y.invert(y0);
        const v1 = y.invert(y1);

        activeBrushes[label] = [
          Math.min(v0, v1),
          Math.max(v0, v1)
        ];
      }

      updateVisibility();
    }

    function updateVisibility() {

      const selected = [];

      data.forEach((d, i) => {

        const visible = Object.entries(activeBrushes).every(
          ([label, [min, max]]) => {
            const v = +d[label];
            return !isNaN(v) && v >= min && v <= max;
          }
        );

        if (visible) selected.push(i);
      });

      // si no hay brushes → todos seleccionados
      if (Object.keys(activeBrushes).length === 0) {
        selected.push(...data.map((_, i) => i));
      }

      const selectedSet = new Set(selected);

      const points = pointsGroup.selectAll("circle");

      points
        .style("fill", function () {
          const i = +this.getAttribute("data-index");
          return selectedSet.has(i)
            ? (categories.length
                ? color(categoricalData[i][selectedCategory])
                : "#4e73df")
            : "lightgrey";
        });

      // traer seleccionados al frente
      points
        .filter(function () {
          const i = +this.getAttribute("data-index");
          return selectedSet.has(i);
        })
        .raise();

      setSelectedIds(selected);
    }

    // Brush
    labels.forEach(label => {

      const brush = d3.brushY()
        .extent([
          [0, 0],
          [x0.bandwidth(), height]
        ])
        .on("brush end", (event) => brushed(label, event));

      svg.append("g")
        .attr("class", "brush")
        .attr("transform", `translate(${x0(label)},0)`)
        .call(brush);
    });
  }
  
  function drawStripPlotUnstructured() {

    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const width = document.getElementById(iddiv).offsetWidth - margin.left - margin.right;
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

    const labels = selectedList;
    const columnWidth = width / labels.length;

    const categories = selectedCategory
      ? Array.from(new Set(categoricalData.map(d => d[selectedCategory])))
      : null;

    const color = categories
      ? d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10)
      : () => "#4e73df";

    const pointsGroup = svg.append("g").attr("class", "points");

    const activeBrushes = {};
    const yScales = {};

    labels.forEach((label, colIndex) => {

      const values = data
        .map((d, i) => ({
          index: i,
          value: +d[label],
          cat: categoricalData?.[i]?.[selectedCategory],
          label: label
        }))
        .filter(d => !isNaN(d.value));

      if (!values.length) return;

      const y = d3.scaleLinear()
        .domain(d3.extent(values.map(d => d.value)))
        .nice()
        .range([height, 0]);

      yScales[label] = y;

      const gCol = pointsGroup
        .append("g")
        .attr("transform", `translate(${colIndex * columnWidth},0)`);

      const cats = categories || ["_all_"];

      const xCat = d3.scaleBand()
        .domain(cats)
        .range([0, columnWidth])
        .paddingInner(0.6)
        .paddingOuter(0.4);

      cats.forEach(cat => {

        const subset = categories
          ? values.filter(d => d.cat === cat)
          : values;

        const jitter = xCat.bandwidth() * 0.6;

        gCol.selectAll(`circle-${label}-${cat}`)
          .data(subset)
          .enter()
          .append("circle")
          .attr("cx", () =>
            xCat(cat) +
            xCat.bandwidth() / 2 +
            (Math.random() - 0.5) * jitter
          )
          .attr("cy", d => y(d.value))
          .attr("r", 2)
          .attr("fill", categories ? color(cat) : "#4e73df")
          .attr("opacity", 0.85)
          .attr("data-index", d => d.index)
          .attr("data-label", d => d.label);
      });

      // label del eje
      gCol.append("text")
        .attr("x", columnWidth / 2)
        .attr("y", height + 25)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(label);

      //Brush
      const brush = d3.brushY()
        .extent([
          [0, 0],
          [columnWidth, height]
        ])
        .on("brush end", (event) => brushed(label, event));

      svg.append("g")
        .attr("class", "brush")
        .attr("transform", `translate(${colIndex * columnWidth},0)`)
        .call(brush);
    });

    function brushed(label, event) {

      if (!d3.event.selection) {
        delete activeBrushes[label];
      } else {
        const [y0, y1] = d3.event.selection;

        const yScale = yScales[label];

        const v0 = yScale.invert(y0);
        const v1 = yScale.invert(y1);

        activeBrushes[label] = [
          Math.min(v0, v1),
          Math.max(v0, v1)
        ];
      }

      updateVisibility();
    }

    function updateVisibility() {

      const selected = [];

      data.forEach((d, i) => {

        const visible = Object.entries(activeBrushes).every(
          ([label, [min, max]]) => {
            const v = +d[label];
            return !isNaN(v) && v >= min && v <= max;
          }
        );

        if (visible) selected.push(i);
      });

      if (Object.keys(activeBrushes).length === 0) {
        selected.push(...data.map((_, i) => i));
      }

      const selectedSet = new Set(selected);

      const points = pointsGroup.selectAll("circle");

      points
        .style("fill", function () {
          const i = +this.getAttribute("data-index");
          return selectedSet.has(i)
            ? (categories
                ? color(categoricalData[i][selectedCategory])
                : "#4e73df")
            : "lightgrey";
        });

      // traer seleccionados adelante
      points
        .filter(function () {
          const i = +this.getAttribute("data-index");
          return selectedSet.has(i);
        })
        .raise();

      setSelectedIds(selected);
    }
  }

  function updateSelectedData(){
    const selectedSet = new Set(selectedIds);

    //puntos
    const points = d3.select("#"+id)
      .selectAll("circle");

    points
      .style("fill", function () {
        const i = +this.getAttribute("data-index");

        return selectedSet.size === 0 || selectedSet.has(i)
          ? d3.select(this).attr("original-fill") || d3.select(this).attr("fill")
          : "lightgrey";
      });

    // traer al frente
    points
      .filter(function () {
        const i = +this.getAttribute("data-index");
        return selectedSet.has(i);
      })
      .raise();


    // líneas
    const lines = d3.select("#"+id)
      .selectAll(".parallel-lines path");

    lines
      .style("stroke", function(){
        const i = +this.getAttribute("data-index");
        return selectedSet.size === 0 || selectedSet.has(i)
          ? d3.select(this).attr("original-stroke") || d3.select(this).attr("stroke")
          : "lightgrey";
      });

    // traer al frente
    lines
      .filter(function () {
        const i = +this.getAttribute("data-index");
        return selectedSet.has(i);
      })
      .raise();
  }

  const dropdownId = `${id}-dropdown`;

  return (
    <div>
      <div className="configuration" style={{ display: "flex" }}>
        <p>axes-type:</p>
        <div className="dropdown-option" style={{ display: "flex" }}>
          <DropdownButton title={axesType} id={"btn-axisx"} onSelect={e => setAxesType(e)}>
            <Dropdown.Item eventKey="Unstructured">Unstructured</Dropdown.Item>
            <Dropdown.Item eventKey="Quantitative">Quantitative</Dropdown.Item>
          </DropdownButton>
        </div>
        <p>axes-orientation:</p>
        <div className="dropdown-option" style={{ display: "flex" }}>
          <DropdownButton disabled={axesType !== "Quantitative"} title={axesOrientation} id={"btn-axisx"} onSelect={e => setAxesOrientation(e)}>
            <Dropdown.Item eventKey="Orthogonal">Orthogonal</Dropdown.Item>
            <Dropdown.Item eventKey="Parallel">Parallel</Dropdown.Item>
          </DropdownButton>
        </div>
      </div>

      <div className="configuration dropdown-option" style={{ marginTop: 10 }}>
        <p>select axis:</p>
        <DropdownMultiselect 
          id={dropdownId} 
          name={dropdownId} 
          className="dropdown-up" 
          options={identifiersOptions} 
          handleOnChange={onSelect}/>
      </div>

      <svg id={id}></svg>
    </div>
  );
}