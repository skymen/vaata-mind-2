/**
 * ExploreView Module
 * Handles graph-based visualization of notes
 */
window.ExploreView = (() => {
  // DOM elements
  let viewElement = null;
  let backButton = null;
  let graphContainer = null;
  let filterControls = null;
  let progressFilters = null;

  // State
  let activeFilters = new Set();
  let activeProgressFilter = "all";

  /**
   * Initialize the explore view
   */
  function initialize() {
    // Cache DOM elements
    viewElement = document.getElementById(Constants.VIEWS.EXPLORE);
    backButton = document.getElementById("explore-back");

    if (!viewElement) {
      console.error("ExploreView: Required elements not found");
      return;
    }

    // Create view HTML structure if empty
    if (viewElement.children.length === 0) {
      createViewStructure();
    }

    // Cache references to newly created elements
    graphContainer = document.getElementById("graph-container");
    filterControls = document.getElementById("filter-controls");
    progressFilters = document.querySelectorAll(".progress-filter");

    // Attach event listeners
    attachEventListeners();

    // Register with view manager
    ViewManager.registerView(Constants.VIEWS.EXPLORE, {
      initialize: initialize,
      show: show,
      hide: hide,
    });

    // Add window resize handler for graph
    window.addEventListener("resize", () => {
      if (ViewManager.getCurrentView() === Constants.VIEWS.EXPLORE) {
        createGraphVisualization();
      }
    });
  }

  /**
   * Create the view's HTML structure
   */
  function createViewStructure() {
    viewElement.innerHTML = `
      <button class="back-btn" id="explore-back">←</button>
      <div class="explore-container">
        <div class="filter-controls" id="filter-controls">
          <!-- Hashtags will be populated here -->
        </div>
        <div class="filter-controls" id="progress-filters">
          <div class="progress-filter" data-progress="all">
            <div class="progress-indicator" style="border-color: transparent"></div>
            All
          </div>
          <div class="progress-filter" data-progress="not-started">
            <div class="progress-indicator not-started"></div>
            Not Started
          </div>
          <div class="progress-filter" data-progress="in-progress">
            <div class="progress-indicator in-progress"></div>
            In Progress
          </div>
          <div class="progress-filter" data-progress="done">
            <div class="progress-indicator done"></div>
            Done
          </div>
        </div>
        <div class="explore-hint">
          <p>Tip: Click to edit a task, Shift+Click to add it to Pomodoro</p>
        </div>
        <div class="graph-container" id="graph-container">
          <!-- Graph will be rendered here -->
        </div>
      </div>
    `;

    // Re-cache elements
    graphContainer = document.getElementById("graph-container");
    filterControls = document.getElementById("filter-controls");
    progressFilters = document.querySelectorAll(".progress-filter");
    backButton = document.getElementById("explore-back");
  }

  /**
   * Attach event listeners to DOM elements
   */
  function attachEventListeners() {
    // Back button
    if (backButton) {
      backButton.addEventListener("click", () => {
        ViewManager.showView(Constants.VIEWS.MENU);
      });
    }

    // Progress filters
    progressFilters.forEach((filter) => {
      filter.addEventListener("click", () => {
        const progress = filter.getAttribute("data-progress");
        activeProgressFilter = progress;
        updateProgressFilters();
        createGraphVisualization();
      });
    });
  }

  /**
   * Update the filter UI
   */
  function updateFilters() {
    if (!filterControls) return;

    // Get all hashtags for filtering
    const allHashtags = Database.getAllHashtags();

    // Clear filters
    filterControls.innerHTML = "";

    // Add "All" filter
    const allFilter = document.createElement("div");
    allFilter.className = `filter-tag ${
      activeFilters.size === 0 ? "active" : ""
    }`;
    allFilter.textContent = "All";
    allFilter.addEventListener("click", () => {
      activeFilters.clear();
      updateFilters();
      createGraphVisualization();
    });
    filterControls.appendChild(allFilter);

    // Add hashtag filters
    allHashtags.forEach((tag) => {
      const tagFilter = document.createElement("div");
      tagFilter.className = `filter-tag ${
        activeFilters.has(tag) ? "active" : ""
      }`;
      tagFilter.textContent = tag;
      tagFilter.addEventListener("click", () => {
        if (activeFilters.has(tag)) {
          activeFilters.delete(tag);
        } else {
          activeFilters.add(tag);
        }
        updateFilters();
        createGraphVisualization();
      });
      filterControls.appendChild(tagFilter);
    });
  }

  /**
   * Update progress filter UI
   */
  function updateProgressFilters() {
    // Set active class on the selected progress filter
    document.querySelectorAll(".progress-filter").forEach((filter) => {
      const progress = filter.getAttribute("data-progress");
      if (progress === activeProgressFilter) {
        filter.classList.add("active");
      } else {
        filter.classList.remove("active");
      }
    });
  }

  /**
   * Create a D3.js graph visualization
   */
  function createGraphVisualization() {
    if (!graphContainer) return;

    // Determine which notes to display based on filters
    let notesToDisplay = Database.getAllNotes();

    // Apply hashtag filters if any
    if (activeFilters.size > 0) {
      notesToDisplay = notesToDisplay.filter((note) =>
        note.hashtags.some((tag) => activeFilters.has(tag))
      );
    }

    // Apply progress filter if not 'all'
    if (activeProgressFilter !== "all") {
      notesToDisplay = notesToDisplay.filter(
        (note) => note.progress === activeProgressFilter
      );
    } else {
      // Default to exclude done notes
      notesToDisplay = notesToDisplay.filter(
        (note) => note.progress !== Constants.PROGRESS_STATES.DONE
      );
    }

    // Clear the container
    d3.select(graphContainer).selectAll("*").remove();

    // If no notes match filters or there are no notes, show a message
    if (notesToDisplay.length === 0) {
      d3.select(graphContainer)
        .append("div")
        .style("display", "flex")
        .style("height", "100%")
        .style("justify-content", "center")
        .style("align-items", "center")
        .text(
          Database.getAllNotes().length === 0
            ? "No notes yet. Create some notes first!"
            : "No notes match the current filters"
        );
      return;
    }

    // Create SVG
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;

    const svg = d3
      .select(graphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Create a container group that will be transformed for zoom/pan
    const container = svg.append("g");

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Define nodes and links for the graph
    const nodes = notesToDisplay.map((note) => ({
      id: note.id,
      content:
        note.content.substring(0, 50) + (note.content.length > 50 ? "..." : ""),
      hashtags: note.hashtags,
      progress: note.progress,
      dueDate: note.dueDate,
      important: note.important,
      radius: 10 + Math.min(note.content.length / 20, 20),
    }));

    // Create links between notes with the same hashtags
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const commonTags = nodes[i].hashtags.filter((tag) =>
          nodes[j].hashtags.includes(tag)
        );

        if (commonTags.length > 0) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: commonTags.length,
          });
        }
      }
    }

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 200 - 20 * d.strength)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.radius + 10)
      );

    // Create links
    const link = container
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.strength));

    // Create nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "note")
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("click", function (event, d) {
        // Check if shift key is pressed
        if (event.shiftKey) {
          // Add to Pomodoro if shift key is pressed
          const switchToPomodoro = confirm("Add this note to Pomodoro and switch to Pomodoro view?");
          
          // Add the note to pomodoro
          const added = PomodoroView.addTaskFromView(d.id, false, switchToPomodoro);
          
          if (added && !switchToPomodoro) {
            StatusMessage.show("Added to Pomodoro queue", 2000, true);
          }
        } else {
          // Regular click to edit
          ViewManager.showView(Constants.VIEWS.EDITOR, { noteId: d.id });
        }
      });

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        // If important, use a special color
        if (d.important) {
          return "hsl(0, 80%, 70%)"; // Reddish for important notes
        }

        // Color based on number of hashtags
        const hue = (d.hashtags.length * 30) % 360;

        // If has due date, adjust color saturation based on urgency
        if (d.dueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const dueDate = new Date(d.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          const daysUntilDue = Math.floor(
            (dueDate - today) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilDue < 0) {
            return "hsl(0, 80%, 60%)"; // Red for overdue
          } else if (daysUntilDue === 0) {
            return "hsl(30, 90%, 60%)"; // Orange for today
          } else if (daysUntilDue === 1) {
            return "hsl(45, 90%, 60%)"; // Amber for tomorrow
          }
        }

        return `hsl(${hue}, 70%, 60%)`;
      })
      .attr("stroke", (d) => (d.important ? "#f44336" : "#fff"))
      .attr("stroke-width", (d) => (d.important ? 3 : 2));

    // Add progress indicators to nodes
    node.each(function (d) {
      // Create progress indicator SVG
      const indicator = createProgressIndicatorSVG(d.progress, 6);

      // Convert SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(indicator);

      // Add it to the node
      const foreignObject = d3
        .select(this)
        .append("foreignObject")
        .attr("width", 12)
        .attr("height", 12)
        .attr("x", -6) // Center it
        .attr("y", -6); // Move above the node

      foreignObject.html(svgString);
    });

    // Add due date markers if applicable
    node.each(function (d) {
      if (d.dueDate) {
        const dateText = d3
          .select(this)
          .append("text")
          .attr("y", -d.radius - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("fill", NoteUtils.getDueDateTextColor(d.dueDate));

        dateText.text(NoteUtils.formatShortDueDate(d.dueDate));
      }

      // Add importance indicator if applicable
      if (d.important) {
        d3.select(this)
          .append("text")
          .attr("y", d.radius / 2 - 2)
          .attr("x", -d.radius - 10) // Center the text
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text("⭐");
      }
    });

    // Add text below node
    node
      .append("text")
      .text((d) => d.content)
      .attr("x", 0) // Center the text
      .attr("y", (d) => d.radius + 15) // Position below the node
      .attr("text-anchor", "middle") // Center horizontally
      .attr("font-size", "12px")
      .attr("fill", (d) =>
        d.progress === Constants.PROGRESS_STATES.DONE ? "#888" : "#333"
      );

    // Add hashtags below content
    node
      .append("text")
      .text((d) => d.hashtags.join(" "))
      .attr("x", 0) // Center the text
      .attr("y", (d) => d.radius + 30) // Position below the content
      .attr("text-anchor", "middle") // Center horizontally
      .attr("font-size", "10px")
      .attr("fill", (d) =>
        d.progress === Constants.PROGRESS_STATES.DONE ? "#888" : "#6C63FF"
      );

    // Simulation tick function
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }

  /**
   * Create a progress indicator SVG element
   * @param {string} progress - Progress state
   * @param {number} radius - Circle radius
   * @returns {SVGElement} SVG element
   */
  function createProgressIndicatorSVG(progress, radius = 12) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.transform = "rotate(45deg)";
    svg.setAttribute("width", radius * 2);
    svg.setAttribute("height", radius * 2);
    svg.setAttribute("viewBox", `0 0 ${radius * 2} ${radius * 2}`);

    // Create circle border
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", radius);
    circle.setAttribute("cy", radius);
    circle.setAttribute("r", radius - 1);
    circle.setAttribute("stroke", "#333");
    circle.setAttribute("stroke-width", "1");
    circle.setAttribute("fill", "var(--not-started-color)");
    svg.appendChild(circle);

    if (progress === Constants.PROGRESS_STATES.IN_PROGRESS) {
      // Half-filled circle for in-progress
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute(
        "d",
        `M ${radius} 1.5 A ${radius - 2} ${radius - 2} 0 0 1 ${radius} ${
          radius * 2 - 1.5
        }`
      );
      path.setAttribute("fill", "var(--in-progress-color)");
      svg.appendChild(path);
    } else if (progress === Constants.PROGRESS_STATES.DONE) {
      // Full circle for done
      const innerCircle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      innerCircle.setAttribute("cx", radius);
      innerCircle.setAttribute("cy", radius);
      innerCircle.setAttribute("r", radius - 1.5);
      innerCircle.setAttribute("fill", "var(--completed-color)");
      svg.appendChild(innerCircle);
    }

    return svg;
  }

  /**
   * Show the explore view
   */
  function show() {
    updateFilters();
    updateProgressFilters();
    createGraphVisualization();
  }

  /**
   * Hide the explore view
   */
  function hide() {
    // Optional cleanup
  }

  /**
   * Handle keydown events in explore view
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      ViewManager.showView(Constants.VIEWS.MENU);
    }
  }

  // Public API
  return {
    initialize,
    show,
    hide,
    handleKeyDown,
  };
})();
