import { useEffect, useRef, useState, useContext } from "react";
import { DataContext } from "../../context/DataContext.jsx";
import DropdownMultiselect from "react-multiselect-dropdown-bootstrap";
import * as d3 from "d3";
import "./Styles/SOMStyles.css";

export default function SOMTechnique({ id, iddiv, flag }) {
  
  const { data, selectedIds, setSelectedIds, categoricalData,
    selectedCategory, identifiersList} = useContext(DataContext);

    const tooltipRef = useRef(null);

  const [identifiersOptions] = useState(
    identifiersList.map((label, i) => ({ label, key: i }))
  );

  const [neurons, setNeurons] = useState(10);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const gridSize = neurons;
  const hexRadius = 16;
  //https://www.visualcinnamon.com/2013/07/self-organizing-maps-creating-hexagonal/

  useEffect(() => {
    if (selectedOptions.length < 2) return;

    d3.select("#" + id).selectAll("*").remove();

    d3.select("#" + id).selectAll("*").remove();

    const width = document.getElementById(iddiv).offsetWidth;
    const height = document.getElementById(iddiv).offsetHeight;

    const svg = d3
      .select("#" + id)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    // ---------------- HEX CONFIG ----------------
    

    function hexToPixel(x, y) {
      const px = (x + (y % 2) * 0.5) * hexRadius * 1.9;
      const py = y * hexRadius * 1.6;
      return [px - (gridSize * hexRadius), py - (gridSize * hexRadius)];
    }

    function hexPoints(cx, cy, r) {
      return d3.range(6).map(i => {
        const a = Math.PI / 3 * i + Math.PI / 6;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      });
    }

    const line = d3.line().curve(d3.curveLinearClosed);

    // ---------------- DATA ----------------

    const matrix = data.map(d =>
      selectedOptions.map(f => +d[f])
    );

    const normalize = (m) => {
      const cols = m[0].length;
      const min = Array(cols).fill(Infinity);
      const max = Array(cols).fill(-Infinity);

      m.forEach(r => {
        r.forEach((v, i) => {
          min[i] = Math.min(min[i], v);
          max[i] = Math.max(max[i], v);
        });
      });

      return m.map(r =>
        r.map((v, i) => (v - min[i]) / (max[i] - min[i] || 1))
      );
    };

    const normData = normalize(matrix);

    // ---------------- SOM ----------------
    let neurons = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        neurons.push({
          x,
          y,
          w: Array(normData[0].length)
            .fill(0)
            .map(() => Math.random())
        });
      }
    }

    const dist = (a, b) =>
      Math.sqrt(d3.sum(a.map((v, i) => (v - b[i]) ** 2)));

    // ---------------- ENTRENAMIENTO SOM ----------------
    let lr = 0.5;
    let radius = gridSize / 2;

    for (let iter = 0; iter < 300; iter++) {
      normData.forEach(sample => {

        let bmu = neurons.reduce((best, n) =>
          dist(sample, n.w) < dist(sample, best.w) ? n : best
        );

        neurons.forEach(n => {
          const dGrid = Math.sqrt(
            (n.x - bmu.x) ** 2 + (n.y - bmu.y) ** 2
          );

          if (dGrid < radius) {
            const influence = Math.exp(-(dGrid ** 2) / (2 * radius ** 2));

            n.w = n.w.map((w, i) =>
              w + influence * lr * (sample[i] - w)
            );
          }
        });

      });

      lr *= 0.9;
      radius *= 0.9;
    }


    // ---------------- MAPEO DE ÍNDICES ----------------
    const cellData = {};
    neurons.forEach(n => cellData[`${n.x}-${n.y}`] = []);

    normData.forEach((sample, idx) => {
      let bmu = neurons.reduce((best, n) =>
        dist(sample, n.w) < dist(sample, best.w) ? n : best
      );

      const key = `${bmu.x}-${bmu.y}`;
      cellData[key].push(idx);
    });
    
    // ---------------- COLOR ----------------
    let color = () => "#4e73df";

    if (selectedCategory != null) {
      const categories = Array.from(
        new Set(categoricalData.map(d => d[selectedCategory]))
      );

      color = d3
        .scaleOrdinal()
        .domain(categories)
        .range(d3.schemeCategory10);
    }


    // ---------------- DRAW ----------------
    svg.append("g")
      .selectAll("path")
      .data(neurons.map((n, i) => ({...n, i})))
      .enter()
      .append("path")
      .attr("d", d => {
        const [x, y] = hexToPixel(d.x, d.y);
        return line(hexPoints(x, y, hexRadius));
      })
      .attr("fill", d => {
        if (selectedCategory == null) return "#4e73df";

        const key = `${d.x}-${d.y}`;
        const indices = cellData[key];

        if (!indices || indices.length === 0) return "#eee";

        let r = 0, g = 0, b = 0;

        indices.forEach(i => {
          const cat = categoricalData[i][selectedCategory];
          if (!cat) return;

          const c = d3.color(color(cat));
          r += c.r;
          g += c.g;
          b += c.b;
        });

        const n = indices.length;

        return `rgb(${Math.round(r/n)}, ${Math.round(g/n)}, ${Math.round(b/n)})`;
      })
      .attr("stroke", "none")
      .on("mousemove", function(event, d) {
        const datum = d3.select(this).datum();
        const key = `${datum.x}-${datum.y}`;
        const indices = cellData[key] || [];
        
        const tooltip = d3.select(tooltipRef.current);

        // Info básica
        let html = `
          <strong>Neurona:</strong> (${datum.x}-${datum.y})<br/>
          <strong>Cantidad:</strong> ${indices.length}
        `;

        // Si hay categoría, agregamos detalle
        if (selectedCategory != null && indices.length > 0) {
          const counts = {};

          indices.forEach(i => {
            const cat = categoricalData[i][selectedCategory];
            if (!cat) return;
            counts[cat] = (counts[cat] || 0) + 1;
          });

          html += `<br/><strong>Distribución:</strong><br/>`;

          Object.entries(counts).forEach(([k, v]) => {
            html += `${k}: ${v}<br/>`;
          });
        }

        tooltip
          .html(html)
          .style("opacity", 1)
          .style("left", d3.event.pageX/2 + "px")
          .style("top", d3.event.pageY/2 + "px");
      })
      .on("mouseout", () => {
        d3.select(tooltipRef.current).style("opacity", 0);
      });

  }, [data, neurons, flag, selectedOptions, selectedCategory]);

  function onSelect(selectedList) {
    const result = identifiersOptions
      .filter(item => selectedList.includes(item.key.toString()))
      .map(item => item.label);

    setSelectedOptions(result);
  }

  function selectnNeurons(evt){
    setNeurons(evt.target.value);
  }

  const dropdownId = `${id}-dropdown`;

  return (
   <div>
        <div className={"configuration"} style={{display:"flex"}}>
          <div className='input-option'>
          <p> n-neurons: {neurons} </p>
          <input type="range" min="5" max="30" step="5" value={neurons} onChange={(e)=>selectnNeurons(e)} style={{width: '100px'}}/>
        </div>

         
        </div>

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