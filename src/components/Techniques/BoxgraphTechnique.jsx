  import { useEffect, useState, useContext } from 'react';
  import { DataContext } from "../../context/DataContext.jsx";

  import DropdownButton from 'react-bootstrap/DropdownButton';
  import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
  import Dropdown from 'react-bootstrap/Dropdown';
  import './Styles/BoxgraphStyles.css';
  import * as d3 from "d3";
  import { configuration_options } from "../ConfigureTechniques/configuration.js";

  export default function BoxGraphTechnique({ id, iddiv, userConfigArray, flag}) {

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
      updateSelectedData();
    }, [selectedIds, selectedCategory]);

   
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
        drawChartUnstructured();
      }
      else {
        setAxesType("Quantitative");

        if(userConfigArray[idOrthogonal]==1){
          setAxesOrientation("Orthogonal");
          drawChartOrthogonal();
        }
        else {
          if(userConfigArray[idParallel]==1){
            setAxesOrientation("Parallel");
            drawChart();
          }
          else {
            if(userConfigArray[idRadial]==1){
              setAxesOrientation("Radial");
              drawRadialChart();
            }
          }
        }
      }
    }, [data, userConfigArray]);


  function updateSelectedData() { 

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
          
    var pathGroup = d3.select("#" + id).select("g");

    pathGroup.selectAll("path")
      .style("stroke", function(d, i) { 
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
        .filter(item => selectedList.includes(item.key.toString())) // filtrar solo los que estén en selectedKeys
        .map(item => ({
          name: item.label,
          id: Number(item.key) // convertir a número
      }));

      var aux = [];
      result.forEach((element) => aux.push(element.name));

      setSelectedList(aux)
    }

    function drawChart(){

      // Definir dimensiones
      var margin = {
        top: 20,
        right: selectedCategory != null ? 120 : 20,
        bottom: 50,
        left: 20
      };
      var width = document.getElementById('' + iddiv).offsetWidth - margin.left - margin.right;
      var height = document.getElementById('' + iddiv).offsetHeight - document.getElementById('' + iddiv).offsetHeight / 4 - margin.top - margin.bottom;

      d3.select("#" + id).select("g").selectAll("*").remove()

      var svg = d3.select("#" + id)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .select("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");

      // Obtener las etiquetas de las columnas desde this.props.labels
      const labels = selectedList || [];

      // Calcular los valores estadísticos para cada columna
      const boxPlotData = labels.map(label => {

        const columnData = data.map(d => d[label]);

        // Calcular los valores estadísticos necesarios para el boxplot
        const minVal = d3.min(columnData);
        const maxVal = d3.max(columnData);
        const q1 = d3.quantile(columnData.sort(d3.ascending), 0.25);
        const median = d3.quantile(columnData.sort(d3.ascending), 0.5);
        const q3 = d3.quantile(columnData.sort(d3.ascending), 0.75);
        const iqr = q3 - q1;
        const outliers = columnData.filter(d => d < q1 - 1.5 * iqr || d > q3 + 1.5 * iqr);

        return {
          label: label,
          min: minVal,
          q1: q1,
          median: median,
          q3: q3,
          max: maxVal,
          outliers: outliers
        };
      });

      // Escala X para los boxplots
      const xScale = d3.scaleBand()
        .domain(boxPlotData.map(d => d.label))
        .range([0, width])
        .padding(0.4);

      // Escala Y para los valores de los datos
      const yScale = d3.scaleLinear()
        .domain([d3.min(boxPlotData, d => d.min), d3.max(boxPlotData, d => d.max)])
        .nice()
        .range([height, 0]);

      let categories = [];
      if (selectedCategory && Array.isArray(categoricalData)) {
        categories = Array.from(new Set(categoricalData.map(d => d[selectedCategory])));
      }
      
      // Escala de colores
      let color = d3.scaleOrdinal(d3.schemeCategory10);
      if (categories) {
        color = d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10);
      }

      // Función para dibujar un boxplot
      const drawBoxplot = (g, data) => {
        // Box
        g.append("rect")
          .attr("x", d => xScale(d.label))
          .attr("y", d => yScale(d.q3))
          .attr("height", d => yScale(d.q1) - yScale(d.q3))
          .attr("width", xScale.bandwidth())
          .attr("stroke", "black")
          .attr("fill", "#ffffff")
          .attr("stroke-width", 1)

        // Median line
        g.append("line")
          .attr("x1", d => xScale(d.label))
          .attr("x2", d => xScale(d.label) + xScale.bandwidth())
          .attr("y1", d => yScale(d.median))
          .attr("y2", d => yScale(d.median))
          .attr("stroke", "black")
          .attr("stroke-width", 2);

        // Whiskers
        g.append("line")
          .attr("x1", d => xScale(d.label) + xScale.bandwidth() / 2)
          .attr("x2", d => xScale(d.label) + xScale.bandwidth() / 2)
          .attr("y1", d => yScale(d.min))
          .attr("y2", d => yScale(d.q1))
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        g.append("line")
          .attr("x1", d => xScale(d.label) + xScale.bandwidth() / 2)
          .attr("x2", d => xScale(d.label) + xScale.bandwidth() / 2)
          .attr("y1", d => yScale(d.max))
          .attr("y2", d => yScale(d.q3))
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        // Whisker caps
        g.append("line")
          .attr("x1", d => xScale(d.label) + xScale.bandwidth() / 4)
          .attr("x2", d => xScale(d.label) + xScale.bandwidth() * 3 / 4)
          .attr("y1", d => yScale(d.min))
          .attr("y2", d => yScale(d.min))
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        g.append("line")
          .attr("x1", d => xScale(d.label) + xScale.bandwidth() / 4)
          .attr("x2", d => xScale(d.label) + xScale.bandwidth() * 3 / 4)
          .attr("y1", d => yScale(d.max))
          .attr("y2", d => yScale(d.max))
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        // Añadir etiquetas de valores
        g.append("text")
          .attr("x", d => xScale(d.label))
          .attr("y", d => yScale(d.min)+14)
          .attr("dy", "-0.5em")
          .style("font-size", "10px")
          .text(d => `Min: ${d.min}`);

        g.append("text")
          .attr("x", d => xScale(d.label))
          .attr("y", d => yScale(d.median)-6)
          .attr("dy", "0.35em")
          .style("font-size", "10px")
          .text(d => `Med: ${d.median}`);

        g.append("text")
          .attr("x", d => xScale(d.label))
          .attr("y", d => yScale(d.max)-12)
          .attr("dy", "1em")
          .style("font-size", "10px")
          .text(d => `Max: ${d.max}`);
      };

      // Dibujar cada boxplot
      svg.selectAll(".boxplot")
        .data(boxPlotData)
        .enter()
        .append("g")
        .attr("class", "boxplot")
        .call(g => drawBoxplot(g, boxPlotData));

      const drawParallelCoordinates = () => {
        const line = d3.line()
          .x(d => xScale(d.label) + xScale.bandwidth() / 2)
          .y(d => yScale(d.value));

        const pathGroup = svg.append("g");

        // Dibujar las líneas de datos
        data.forEach((datum,i )=> {
          const lineData = labels.map(label => ({
            label: label,
            value: datum[label]
          }));

          pathGroup.append('path')
          .datum(lineData)
          .attr('d', line)
          //.attr('class','active')
          .attr("fill", "none")
          .style("stroke", function() {
            if(selectedIds.length==0)
              return (selectedCategory!=null) ? color(categoricalData[i][selectedCategory]) : "#4E73DF";
            else {
              return selectedIds.includes(i)? (selectCategory!=null ? color(categoricalData[i][selectedCategory]): "rgba(0,0,0,0.2)") : "rgba(0,0,0,0.2)";
            }
          })
          .attr("stroke-width", 1)
          .style("opacity", 0.4);
        });

        // Crear un grupo para los brushes
        const brushGroup = svg.append("g").attr("class", "brushes");
        let selectedIndices = [];

        const brush = d3.brushY()
          .extent([[-10, 0], [10, height]])
          //.on("brush", brushed)
          .on("end", brushed);

        // Crear un objeto para almacenar las selecciones de cada eje
        const selections = {};

        // Añadir brushes a cada eje
        labels.forEach((label, i) => {
          brushGroup.append("g")
          .attr("class", "brush")
          .attr("data-label", label)
          .attr("transform", `translate(${xScale(label) + xScale.bandwidth() / 2},0)`)
          .call(brush);
        });

        
        function brushed(event) {
          const selection = d3.event.selection;
          const brushedLabel = d3.select(this).attr("data-label");

          // Si la selección es nula, se borra la selección para ese eje
          if (!selection) {
            delete selections[brushedLabel];
          } 
          else {
            // Almacenar o actualizar la selección del eje actual
            const [y0, y1] = selection;
            selections[brushedLabel] = { y0, y1 };
          }

          // Actualizar el gráfico basándose en todas las selecciones
          selectedIndices = updatePaths();
          setSelectedIds(selectedIndices);

        }

        function updatePaths() {
          const s = [];
          const activeLabels = Object.keys(selections);

          pathGroup.selectAll("path")
            .style("stroke", function(d, i) { 
              
              if (activeLabels.length === 0) {
                return (selectedCategory!=null ? color(categoricalData[i][selectedCategory]) : "#4e73df");
              }

              const isSelected = activeLabels.every(label => { 
                const sel = selections[label];

                if (!sel) return true;

                const { y0, y1 } = sel;

                return d.some(point =>
                  point.label === label &&
                  yScale(point.value) >= y0 &&
                  yScale(point.value) <= y1
                );
              });

              if (isSelected) s.push(i);

              return isSelected
                      ? (selectedCategory!=null 
                        ? color(categoricalData[i][selectedCategory]) 
                        : "#4e73df")
                      : "rgba(0,0,0,0.2)";
            });
          return s;
        }

        // Inicializar las selecciones si es necesario
        function initializeSelections() {
          labels.forEach(label => {
            selections[label] = null; // O una selección predeterminada si es necesario
          });
        }

        initializeSelections();

      };

      if(axesType==='Quantitative' && axesOrientation==='Parallel')
        // Dibujar las líneas de coordenadas paralelas
        drawParallelCoordinates();

      if (selectedCategory && categories.length > 0) {

        const legend = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${width + 20}, 20)`);

        legend.selectAll("rect")
          .data(categories)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d,i)=> i*20)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", d => color(d));

        legend.selectAll("text")
          .data(categories)
          .enter()
          .append("text")
          .attr("x", 18)
          .attr("y", (d,i)=> i*20 + 10)
          .text(d => d)
          .style("font-size","10px");
      }


      // Estilo para los ejes
      svg.selectAll("text")
      .style("font-size", "12px")
    }

    function drawChartUnstructured() {

      let categories = [];
      if (selectedCategory && Array.isArray(categoricalData)) {
        categories = Array.from(
          new Set(categoricalData.map(d => d[selectedCategory]))
        );
      }

      const margin = { 
        top: 40, 
        right: selectedCategory && categories.length > 0 ? 120 : 30,
        bottom: 60, 
        left: 20 
      };

      const container = document.getElementById(iddiv);
      const width = container.offsetWidth - margin.left - margin.right;

      const boxHeight = container.offsetHeight - container.offsetHeight / 4 - margin.top - margin.bottom;

      d3.select("#" + id).selectAll("*").remove();

      const svg = d3.select("#" + id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", boxHeight + margin.top + margin.bottom + 40)
        .append("g")
        .attr("transform", `translate(${-margin.left},${margin.top})`);

      const labels = selectedList || [];

      function computeBoxStats(values) {
        const sorted = values.slice().sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        return {
          min: Math.max(d3.min(sorted), q1 - 1.5 * iqr),
          q1,
          median,
          q3,
          max: Math.min(d3.max(sorted), q3 + 1.5 * iqr)
        };
      }

      // Escala de color
      const color = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeCategory10);

      let boxPlotData = [];

      if (categories.length > 0) {

        labels.forEach(label => {
          categories.forEach(cat => {
            const values = data
              .filter((d, i) => categoricalData[i]?.[selectedCategory] === cat)
              .map(d => d[label])
              .filter(v => v != null);

            if (values.length) {
              boxPlotData.push({
                label,
                category: cat,
                stats: computeBoxStats(values)
              });
            }
          });
        });
      } else {

        labels.forEach(label => {
          const values = data.map(d => d[label]).filter(v => v != null);
          if (values.length) {
            boxPlotData.push({
              label,
              category: null,
              stats: computeBoxStats(values)
            });
          }
        });
      }

      const x0 = d3.scaleBand()
        .domain(labels)
        .range([0, width])
        .padding(0.3);

      const x1 = categories.length > 0
        ? d3.scaleBand()
            .domain(categories)
            .range([0, x0.bandwidth()])
            .padding(0.2)
        : null;

      // Eje X
      const xAxis = svg.append("g")
      .attr("transform", `translate(0,${boxHeight + 10})`)
      .call(d3.axisBottom(x0));

      xAxis.selectAll("text")
        .attr("text-anchor", "middle")
        .attr("dx", categories.length > 0 ? 0 : -(x0.bandwidth() / 4))
        .attr("dy", "0.8em");

      xAxis.selectAll(".domain").attr("stroke", "none");


      boxPlotData.forEach(d => {

        const local = d.stats;

        // Escala Y LOCAL
        const y = d3.scaleLinear()
          .domain([local.min, local.max])
          .range([boxHeight, 0]);

        const g = svg.append("g")
          .attr(
            "transform",
            categories.length > 0
              ? `translate(${x0(d.label) + x1(d.category)},0)`
              : `translate(${x0(d.label)},0)`
          );

        const bw = categories.length > 0
          ? x1.bandwidth()
          : x0.bandwidth() / 2;

        const cx = bw / 2;
        const cy = 10;

        // ─────────────────────────────
        // Línea min–max
        // ─────────────────────────────
        g.append("line")
          .attr("x1", cx).attr("x2", cx)
          .attr("y1", y(local.min)).attr("y2", y(local.max))
          .attr("stroke", "black");

        // ─────────────────────────────
        // Caja Q1–Q3
        // ─────────────────────────────
        g.append("rect")
          .attr("x", cx - bw / 2)
          .attr("y", y(local.q3))
          .attr("width", bw)
          .attr("height", y(local.q1) - y(local.q3))
          .attr("stroke", "black")
          .attr("fill", categories.length > 0 ? color(d.category) : "#4e73df");

        // ─────────────────────────────
        // Líneas min, mediana, max
        // ─────────────────────────────
        const lines = [
          { key: "Min", value: local.min },
          { key: "Median", value: local.median },
          { key: "Max", value: local.max }
        ];

        lines.forEach(l => {

          g.append("line")
            .attr("x1", cx - bw / 2)
            .attr("x2", cx + bw / 2)
            .attr("y1", y(l.value))
            .attr("y2", y(l.value))
            .attr("stroke", "black");

        });

        // ─────────────────────────────
        // Labels MIN, MEDIAN Y MAX
        // ─────────────────────────────
        g.append("text")
          .attr("x", cx)
          .attr("y", y(local.min) + cy)
          .style("font-size", "10px")
          .style("fill", "black")
          .text(`Min: ${local.min.toFixed(2)}`);

        g.append("text")
          .attr("x", cx + bw / 2 + 3)
          .attr("y", y(local.median) -cy)
          .attr(
            "transform",
            `rotate(90, ${cx + bw / 2 + 3}, ${y(local.median) -cy})`)
          .style("font-size", "10px")
          .style("fill", "black")
          .text(`Median: ${local.median.toFixed(2)}`);

        g.append("text")
          .attr("x", cx)
          .attr("y", y(local.max) - cy)
          .style("font-size", "10px")
          .style("fill", "black")
          .text(`Max: ${local.max.toFixed(2)}`);

        // ─────────────────────────────
        // Labels Q1 y Q3
        // ─────────────────────────────
        g.append("text")
          .attr("x", cx - bw / 2 - 7)
          .attr("y", y(local.q1) + 12)
          .style("font-size", "10px")
          .style("fill", "black")
          .text(`Q1: ${local.q1.toFixed(2)}`);

        g.append("text")
          .attr("x", cx - bw / 2 - 7)
          .attr("y", y(local.q3) - 4)
          .style("font-size", "10px")
          .style("fill", "black")
          .text(`Q3: ${local.q3.toFixed(2)}`);

      });

      if (selectedCategory && categories.length > 0) {

        const legend = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${width + 20}, 20)`);

        legend.selectAll("rect")
          .data(categories)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d,i)=> i*20)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", d => color(d));

        legend.selectAll("text")
          .data(categories)
          .enter()
          .append("text")
          .attr("x", 18)
          .attr("y", (d,i)=> i*20 + 10)
          .text(d => d)
          .style("font-size","10px");
      }
    }

    function drawChartOrthogonal() {
      var margin = {
        top: 20,
        right: selectedCategory != null ? 120 : 50,
        bottom: 50,
        left: 20
      };

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

      function computeBoxStats(values) {
        const sorted = values.slice().sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        return {
          min: Math.max(d3.min(sorted), q1 - 1.5 * iqr),
          q1,
          median,
          q3,
          max: Math.min(d3.max(sorted), q3 + 1.5 * iqr)
        };
      }

      let categories = [];
      if (selectedCategory && Array.isArray(categoricalData)) {
        categories = Array.from(new Set(
          categoricalData.map(d => d[selectedCategory])
        ));
      }

      let boxPlotData = [];

      if (categories.length > 0) {

        labels.forEach(label => {
          categories.forEach(cat => {
            const values = data
              .filter((d, i) => categoricalData[i]?.[selectedCategory] === cat)
              .map(d => d[label])
              .filter(v => v != null);

            if (values.length) {
              boxPlotData.push({
                label,
                category: cat,
                stats: computeBoxStats(values)
              });
            }
          });
        });
      } 
      else {
        labels.forEach(label => {
          const values = data.map(d => d[label]).filter(v => v != null);
          if (values.length) {
            boxPlotData.push({
              label,
              category: null,
              stats: computeBoxStats(values)
            });
          }
        });
      }

      const x0 = d3.scaleBand()
        .domain(labels)
        .range([0, width])
        .padding(0.3);

      const x1 = categories.length > 0
        ? d3.scaleBand()
            .domain(categories)
            .range([0, x0.bandwidth()])
            .padding(0.2)
        : null;

      const yScale = d3.scaleLinear()
        .domain([
          d3.min(boxPlotData, d => d.stats.min),
          d3.max(boxPlotData, d => d.stats.max)
        ])
        .nice()
        .range([height, 0]);

      const color = categories.length > 0
        ? d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10)
        : null;


      svg.append("g").call(d3.axisLeft(yScale));

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

      boxPlotData.forEach(d => {

        const g = svg.append("g");

        const xCenter = categories.length > 0
          ? x0(d.label) + x1(d.category) + x1.bandwidth() / 2
          : x0(d.label) + x0.bandwidth() / 2;

        const boxWidth = categories.length > 0
          ? x1.bandwidth()
          : x0.bandwidth() / 2;

        const offsetX = boxWidth / 2 + 4;
        const offsetY = 3;

        // Línea min-max
        g.append("line")
          .attr("x1", xCenter)
          .attr("x2", xCenter)
          .attr("y1", yScale(d.stats.min))
          .attr("y2", yScale(d.stats.max))
          .attr("stroke", "black");

        // Caja Q1-Q3
        g.append("rect")
          .attr("x", xCenter - boxWidth / 2)
          .attr("y", yScale(d.stats.q3))
          .attr("width", boxWidth)
          .attr("height", yScale(d.stats.q1) - yScale(d.stats.q3))
          .attr("stroke", "black")
          .attr("fill", categories.length > 0 ? color(d.category) : "#4e73df");

        // Líneas min, median, max
        [d.stats.min, d.stats.median, d.stats.max].forEach(v => {
          g.append("line")
            .attr("x1", xCenter - boxWidth / 2)
            .attr("x2", xCenter + boxWidth / 2)
            .attr("y1", yScale(v))
            .attr("y2", yScale(v))
            .attr("stroke", "black");
        });

        // ───────── Labels ─────────
        g.append("text")
          .attr("x", xCenter + offsetX)
          .attr("y", yScale(d.stats.min) + offsetY)
          .style("font-size", "6px")
          .text(`Min: ${d.stats.min.toFixed(2)}`);

        g.append("text")
          .attr("x", xCenter - offsetX)
          .attr("y", yScale(d.stats.q1) + offsetY)
          .attr("text-anchor", "end")
          .style("font-size", "6px")
          .text(`Q1: ${d.stats.q1.toFixed(2)}`);

        g.append("text")
          .attr("x", xCenter + offsetX)
          .attr("y", yScale(d.stats.median) - offsetY)
          .style("font-size", "6px")
          .text(`Med: ${d.stats.median.toFixed(2)}`);

        g.append("text")
          .attr("x", xCenter - offsetX)
          .attr("y", yScale(d.stats.q3) - offsetY)
          .attr("text-anchor", "end")
          .style("font-size", "6px")
          .text(`Q3: ${d.stats.q3.toFixed(2)}`);

        g.append("text")
          .attr("x", xCenter + offsetX)
          .attr("y", yScale(d.stats.max) - offsetY)
          .style("font-size", "6px")
          .text(`Max: ${d.stats.max.toFixed(2)}`);

      });

      if (selectedCategory != null && categories.length > 0) {

        const legend = svg.append("g")
          .attr("transform", `translate(${width + 20}, 0)`);

        legend.selectAll("rect")
          .data(categories)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d, i) => i * 20)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", d => color(d));

        legend.selectAll("text")
          .data(categories)
          .enter()
          .append("text")
          .attr("x", 18)
          .attr("y", (d, i) => i * 20 + 10)
          .text(d => d)
          .style("font-size", "10px");
      }

    }

    function drawRadialChart() { // Definir dimensiones 
      // Definir dimensiones 
      var margin = { top: 80, right: 80, bottom: 80, left: 80 }; 
      var width = document.getElementById('' + iddiv).offsetWidth - margin.left - margin.right; 
      var height = document.getElementById('' + iddiv).offsetHeight - document.getElementById('' + iddiv).offsetHeight/8 - margin.top - margin.bottom; 
      var radius = Math.min(width, height) / 2;

      d3.select("#" + id).select("g").selectAll("*").remove(); 
      
      var svg = d3.select("#" + id) 
        .attr("width", width + margin.left + margin.right) 
        .attr("height", height + margin.top + margin.bottom) 
          .select("g") 
            .attr("transform", `translate(${width/2 + margin.left}, ${height/2 + margin.top})`);

      // Etiquetas de columnas 
      const labels = selectedList || []; 
      
      // Categorías únicas
      let categories = null; 
      if (selectedCategory && Array.isArray(categoricalData)) { 
        categories = Array.from(new Set(categoricalData.map(d => d[selectedCategory]))); 
      }

      // Calcular los valores estadísticos para cada columna 
      const boxPlotData = labels.map(label => { 
        const columnData = data.map(d => d[label]); 
        
        // Encuentra los valores mínimo y máximo 
        const min = Math.min(...columnData); 
        const max = Math.max(...columnData); 
        
        // Normaliza los valores entre 0 y 1 
        const normalizedData = columnData.map(value => value); 
        // Calcular los valores estadísticos necesarios para el boxplot 
        const minVal = d3.min(normalizedData); 
        const maxVal = d3.max(normalizedData); 
        const q1 = d3.quantile(normalizedData.sort(d3.ascending), 0.25); 
        const median = d3.quantile(normalizedData.sort(d3.ascending), 0.5); 
        const q3 = d3.quantile(normalizedData.sort(d3.ascending), 0.75); 
        const iqr = q3 - q1; 
        const outliers = normalizedData.filter(d => d < q1 - 1.5 * iqr || d > q3 + 1.5 * iqr);

        return { 
          label: label, 
          min: minVal, 
          q1: q1.toFixed(2), 
          median: median.toFixed(2), 
          q3: q3.toFixed(2), 
          max: maxVal.toFixed(2), 
          outliers: outliers 
        }; 
      });

      const angleSlice = (2 * Math.PI) / boxPlotData.length; 
      // Función para convertir ángulo y radio a coordenadas x, y 
      const angleToCoord = (angle, value, scale) => { 
        return { x: Math.cos(angle - Math.PI / 2) * scale(value), // Restar PI/2 para alinear correctamente 
        y: Math.sin(angle - Math.PI / 2) * scale(value) }; 
      };

      // Función para dibujar un boxplot 
      const drawBoxplot = (g, data, angle, scale) => { // Rotar el grupo 
        g.attr("transform", `rotate(${angle * 180 / Math.PI})`);
        g.append("rect") 
          .attr("x", -5) 
          .attr("y", d => scale(d.q1)) 
          .attr("height", d => Math.abs(scale(d.q1) - scale(d.q3))) // Asegurar que la altura sea positiva 
          .attr("width", 10) 
          .attr("stroke", "black") 
          .attr("fill", "#ffffff") 
          .attr("stroke-width", 1); // Median line 
          
        g.append("line") 
          .attr("x1", -5) 
          .attr("x2", 5) 
          .attr("y1", d => scale(d.median)) 
          .attr("y2", d => scale(d.median)) 
          .attr("stroke", "black") 
          .attr("stroke-width", 2); // Whiskers 
        
        g.append("line") 
          .attr("x1", 0) 
          .attr("x2", 0) 
          .attr("y1", d => scale(d.min)) 
          .attr("y2", d => scale(d.q1)) 
          .attr("stroke", "black") 
          .attr("stroke-width", 1); 
          
        g.append("line") 
          .attr("x1", 0) 
          .attr("x2", 0) 
          .attr("y1", d => scale(d.max)) 
          .attr("y2", d => scale(d.q3)) 
          .attr("stroke", "black") 
          .attr("stroke-width", 1); // Whisker caps 
        
        g.append("line") .attr("x1", -5) 
          .attr("x2", 5) 
          .attr("y1", d => scale(d.min)) 
          .attr("y2", d => scale(d.min)) 
          .attr("stroke", "black") 
          .attr("stroke-width", 1); 
        
        g.append("line") .attr("x1", -5) 
          .attr("x2", 5) .attr("y1", d => scale(d.max)) 
          .attr("y2", d => scale(d.max)) 
          .attr("stroke", "black") 
          .attr("stroke-width", 1); 
          
        // Añadir etiquetas de valores 
        g.append("text") 
          .attr("x", 0) 
          .attr("y", d => scale(d.min)) 
          .attr("dy", "-0.5em") 
          .style("font-size", "10px") 
          .text(d => "Min:"+d.min); 
          
        g.append("text") 
          .attr("x", 12) 
          .attr("y", d => scale(d.median)) 
          .attr("dy", "0.35em") 
          .style("font-size", "10px") 
          .text(d => "Med:" + d.median); 
          
        g.append("text") 
          .attr("x", 0) 
          .attr("y", d => scale(d.max)) 
          .attr("dy", "1em") 
          .style("font-size", "10px") 
          .text(d => "Max: "+ d.max); 
          
        // Añadir etiquetas de los ejes 
        
        g.append("text") 
          .attr("class", "axis-label") 
          .attr("x", 0) 
          .attr("y", d => scale(d.max) + 20) 
          .attr("text-anchor", "middle") 
          .style("font-size", "12px") 
          .text(d => d.label); 
      };

      // Dibujar cada boxplot 
        
      svg.selectAll(".boxplot") 
        .data(boxPlotData) 
        .enter() 
        .append("g") 
          .attr("class", "boxplot") 
          .each(function(d, i) { // Crear una escala radial independiente para cada eje 
            const rScale = d3.scaleLinear() 
              .domain([d.min, d.max]) 
              .range([30, radius]); 
            drawBoxplot(d3.select(this), d, i * angleSlice, rScale); // Dibujar la línea radial corta para cada eje 
          });

        // Función para dibujar líneas de coordenadas paralelas en el gráfico radial 
        const drawParallelCoordinates = () => { 
          const line = d3.lineRadial() 
            .angle((d, i) => i * angleSlice + Math.PI) // Añadir Math.PI para rotar 180 grados 
            .radius((d, i) => { 
              const scale = d3.scaleLinear() 
                .domain([d3.min(data.map(e => e[d.label])), d3.max(data.map(e => e[d.label]))]) 
                .range([30, radius]); 
              return scale(d.value); 
            });

            data.forEach((datum, i) => { 
              const lineData = labels.map(label => ({ 
                label: label, 
                value: datum[label], 
                color: categoricalData[i][selectedCategory] 
              })); 
              
              lineData.push(lineData[0]); 
              
              let color = d3.scaleOrdinal(d3.schemeCategory10); 
              if (categories) { 
                color = d3.scaleOrdinal()
                .domain(categories).range(d3.schemeCategory10); 
              }

              svg.append("path") 
                .datum(lineData) 
                .attr("fill", "none") 
                .style("stroke", function() { 
                  if(selectedIds.length==0) 
                    return (selectedCategory!=null) ? color(lineData[0].color) : "#4E73DF"; 
                  else { 
                    return selectedIds.includes(i) ? (selectedCategory!=null ? color(lineData[0].color) : "#4E73DF") : "rgba(0,0,0,0.2)"; 
                  } 
                }) 
                .attr("stroke-width", 1) 
                .style("opacity", 0.5) 
                .attr("d", line); 
            });

            const brush = d3.brushY() 
              .extent([[-10, 0], [10, radius]]) 
              //.on("brush", brushed) 
              .on("end", brushed); 
                
            const axes = svg.selectAll(".axis") 
              .data(labels) 
              .enter() 
              .append("g") 
              .attr("class", "axis") 
              .attr("data-label", d => d) // Adjuntar etiqueta correcta 
              .attr("transform", (d, i) => `rotate(${(i * angleSlice) * 180 / Math.PI})`);
              
            axes.append("line") 
              .attr("x1", 0) 
              .attr("y1", 0) 
              .attr("x2", 0) 
              .attr("y2", radius) 
              .attr("stroke", "black");

            axes.call(brush); 
            const selections = {}; 
            var selectedIndices = [];

            function brushed(event) { 
              const brushSelection = d3.event.selection; 
              const brushedLabel = d3.select(this)
                .attr("data-label"); 
                
              if (!brushSelection) { 
                delete selections[brushedLabel]; 
              }
              else { 
                const [y0, y1] = brushSelection; // Crear una escala radial adecuada para el eje actual 
                const scale = d3.scaleLinear() 
                  .domain([30, radius]) // Ajustar el dominio basado en el rango radial usado 
                  .range([d3.min(data.map(d => d[brushedLabel])), d3.max(data.map(d => d[brushedLabel]))]); // Convertir las coordenadas del brush a valores de datos 
                  
                  const minValue = scale(y0); 
                  const maxValue = scale(y1); 
                  selections[brushedLabel] = { minValue, maxValue }; 
              } 
                
              // Actualizar el gráfico basado en las selecciones 
              selectedIndices = updatePaths(); 
              setSelectedIds(selectedIndices);
            }

            function updatePaths() { 
              var selected = []; 
              const activeLabels = Object.keys(selections);

              // Escala de colores
              let color = d3.scaleOrdinal(d3.schemeCategory10);
              if (categories) { 
                color = d3.scaleOrdinal()
                  .domain(categories)
                  .range(d3.schemeCategory10); 
              }

              var pathGroup = d3.select("#" + id).select("g");

              pathGroup.selectAll("path")
                .style("stroke", function(d, i) { 

                  if (activeLabels.length === 0) {
                    selected.push(i);
                    return selectedCategory != null 
                      ? color(categoricalData[i][selectedCategory]) 
                      : "#4e73df";
                  }

                  const isSelected = activeLabels.every(label => { 
                    const { minValue, maxValue } = selections[label]; 
                    return data[i][label] >= minValue && data[i][label] <= maxValue; 
                  }); 

                  if (isSelected) selected.push(i); 

                  return isSelected 
                    ? (selectedCategory != null 
                        ? color(categoricalData[i][selectedCategory]) 
                        : "#4e73df")
                    : "rgba(0,0,0,0.2)"; 
                }); 

              return selected; 
            }
        };
      
      // Llamar a la función para dibujar las líneas de coordenadas paralelas 
      drawParallelCoordinates(); 

      if (selectedCategory != null && categories && categories.length > 0) {

        const legend = svg.append("g")
          .attr("class", "legend")
          .attr("transform", `translate(${radius + 40}, ${-height/2})`);

        legend.selectAll("rect")
          .data(categories)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d, i) => i * 20)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", d => {
            return d3.scaleOrdinal()
              .domain(categories)
              .range(d3.schemeCategory10)(d);
          });

        legend.selectAll("text")
          .data(categories)
          .enter()
          .append("text")
          .attr("x", 18)
          .attr("y", (d, i) => i * 20 + 10)
          .text(d => d)
          .style("font-size", "10px")
          .attr("alignment-baseline", "middle");
      }

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
            <DropdownButton
              title={axesType}
              id={"btn-axisx"}
              onSelect={(e) => selectAxesType(e)}
            >
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
            <DropdownButton
              disabled={axesType==='Quantitative' ? false : true}
              title={axesOrientation}
              id={"btn-axisx"}
              onSelect={(e) => selectAxesOrientation(e)}
            >
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