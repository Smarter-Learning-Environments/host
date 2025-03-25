// src/SensorGraph.js
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const SensorGraph = ({ title, sensorSeries }) => {
    const ref = useRef();

    useEffect(() => {
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove(); // Clear previous contents

        const width = 500;
        const height = 250;
        const margin = { top: 20, right: 30, bottom: 30, left: 50 };

        svg
            .attr("width", width)
            .attr("height", height)
            .style("background", "#fff");

        const x = d3
            .scaleTime()
            .range([margin.left, width - margin.right]);

        const y = d3
            .scaleLinear()
            .range([height - margin.bottom, margin.top]);

        // Flatten all values for domain calculations
        const allPoints = sensorSeries.flatMap(series => series.data);

        x.domain(d3.extent(allPoints, d => new Date(d.x)));
        y.domain([0, d3.max(allPoints, d => d.y)]);

        const xAxis = d3.axisBottom(x).ticks(5);
        const yAxis = d3.axisLeft(y);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(xAxis);

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis);

        const units = sensorSeries[0]?.unit || "";

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Time");
    
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(`${title}${units ? ` (${units})` : ""}`);

        const line = d3.line()
            .x(d => x(new Date(d.x)))
            .y(d => y(d.y))
            .curve(d3.curveMonotoneX);

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "d3-tooltip")
            .style("position", "absolute")
            .style("padding", "8px")
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("opacity", 0);

        sensorSeries.forEach((series, i) => {
            svg.append("path")
                .datum(series.data)
                .attr("fill", "none")
                .attr("stroke", d3.schemeCategory10[series.colorIndex % 10])
                .attr("stroke-width", 2)
                .attr("d", line);

            svg.selectAll(`.circle-${i}`)
                .data(series.data)
                .enter()
                .append("circle")
                .attr("cx", d => x(new Date(d.x)))
                .attr("cy", d => y(d.y))
                .attr("r", 4)
                .attr("fill", d3.schemeCategory10[i % 10])
                .on("mouseover", (event, d) => {
                    tooltip
                        .html(`
                            <strong>Sensor:</strong> ${series.label}<br/>
                            <strong>Value:</strong> ${d.y} ${units}<br/>
                            <strong>Time:</strong> ${new Date(d.x).toLocaleTimeString()}
                        `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px")
                        .transition()
                        .duration(200)
                        .style("opacity", 0.95);
                })
                .on("mouseout", () => {
                    tooltip.transition()
                        .duration(300)
                        .style("opacity", 0);
                });
        });

        return () => {
            tooltip.remove();
        };

    }, [sensorSeries]);

    return (
        <div style={{ marginBottom: "30px" }}>
            <h4>{title}</h4>
            <svg ref={ref}></svg>
        </div>
    );
};

export default SensorGraph;
