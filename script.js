// Global Variables
let jm; // Instance of jsMind
let maxLevel = 0; // Maximum level detected
let selectedLevelColors = {}; // Colors selected for each level
let undoStack = []; // Undo stack
let currentDirection = 'bottom'; // Initial orientation

// Function to parse Markdown and build data structure for jsMind
function parseMarkdownToJsMind(markdown) {
  const lines = markdown.trim().split('\n');
  let rootTopic = 'Mind Map';
  let startIndex = 0;

  if (lines[0].startsWith('# ')) {
    rootTopic = lines[0].substring(2).trim();
    startIndex = 1;
  }

  const root = {
    id: 'root',
    isroot: true,
    topic: rootTopic,
    children: [],
    level: 0, // Root node level
  };

  const stack = [{ node: root, level: -1 }];
  let nodeId = 1;
  maxLevel = 0; // Reset maximum level

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const indentMatch = line.match(/^\s*/);
    const level = indentMatch ? indentMatch[0].length / 2 : 0;
    const trimmedLine = line.trim();
    if (trimmedLine === '') continue;

    if (trimmedLine.startsWith('- ')) {
      const name = trimmedLine.substring(2).trim();
      const nodeLevel = level + 1; // Node level is indentation level + 1
      const node = {
        id: `node${nodeId++}`,
        topic: name,
        children: [],
        level: nodeLevel, // Store the level in the node
      };

      // Update the maximum level
      if (nodeLevel > maxLevel) {
        maxLevel = nodeLevel;
      }

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].node.children.push(node);
      }
      stack.push({ node, level });
    }
  }

  return root;
}

// Function to get the default root color
function getDefaultRootColor() {
  return '#27374d'; // Default color for root
}

// Function to get default colors for levels
function getDefaultColor(level, maxLevel) {
  const predefinedColors = [
    '#e74c3c', // Red
    '#e67e22', // Orange
    '#f1c40f', // Yellow
    '#2ecc71', // Green
    '#1abc9c', // Turquoise
    '#3498db', // Blue
    '#9b59b6', // Purple
    '#34495e', // Dark Blue
    '#7f8c8d', // Gray
  ];
  return predefinedColors[(level - 1) % predefinedColors.length];
}

// Function to get user selected colors
function getUserSelectedColors(maxLevel) {
  const levelColors = {};

  // Color for root (level 0)
  levelColors[0] = selectedLevelColors[0] || getDefaultRootColor();

  // Colors for levels 1 and above
  for (let level = 1; level <= maxLevel; level++) {
    const color = selectedLevelColors[level] || getDefaultColor(level, maxLevel);
    levelColors[level] = color;
  }
  return levelColors;
}

// Function to generate color pickers for each level
function generateLevelColorPickers(maxLevel) {
  const levelColorsContainer = document.getElementById('level-colors-container');
  levelColorsContainer.innerHTML = ''; // Clear previous content

  // Option for root
  const rootSelectorDiv = document.createElement('div');
  rootSelectorDiv.className = 'level-color-selector root-selector';

  const rootLabel = document.createElement('label');
  rootLabel.textContent = `Root`;

  const rootColorDiv = document.createElement('div');
  rootColorDiv.className = 'default-color';
  rootColorDiv.style.backgroundColor = selectedLevelColors[0] || getDefaultRootColor();

  // Store level (0) in data attribute
  rootColorDiv.dataset.level = 0;

  // Add event listener to show popup on click
  rootColorDiv.addEventListener('click', (event) => {
    event.stopPropagation();
    showColorPopup(0, rootColorDiv);
  });

  rootSelectorDiv.appendChild(rootLabel);
  rootSelectorDiv.appendChild(rootColorDiv);
  levelColorsContainer.appendChild(rootSelectorDiv);

  // For levels 1 and above
  for (let level = 1; level <= maxLevel; level++) {
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'level-color-selector';

    const label = document.createElement('label');
    label.textContent = `Level ${level}`;

    const defaultColorDiv = document.createElement('div');
    defaultColorDiv.className = 'default-color';
    defaultColorDiv.style.backgroundColor = selectedLevelColors[level] || getDefaultColor(level, maxLevel);

    // Store level in data attribute
    defaultColorDiv.dataset.level = level;

    // Add event listener to show popup on click
    defaultColorDiv.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent propagation to avoid immediate closure
      showColorPopup(level, defaultColorDiv);
    });

    selectorDiv.appendChild(label);
    selectorDiv.appendChild(defaultColorDiv);
    levelColorsContainer.appendChild(selectorDiv);
  }
}

// Function to show color popup with color options
function showColorPopup(level, parentElement) {
  const colorPopup = document.getElementById('color-popup');
  colorPopup.innerHTML = ''; // Clear previous content

  // Define predefined colors
  const predefinedColors = [
    '#e74c3c', // Red
    '#e67e22', // Orange
    '#f1c40f', // Yellow
    '#2ecc71', // Green
    '#1abc9c', // Turquoise
    '#3498db', // Blue
    '#9b59b6', // Purple
    '#34495e', // Dark Blue
    '#7f8c8d', // Gray
  ];

  predefinedColors.forEach(color => {
    const colorOption = document.createElement('div');
    colorOption.className = 'color-option';
    colorOption.style.backgroundColor = color;

    // Check if this color is selected for the level
    const selectedColor = selectedLevelColors[level] || (level === 0 ? getDefaultRootColor() : getDefaultColor(level, maxLevel));
    if (color === selectedColor) {
      colorOption.classList.add('selected');
    }

    // Add event listener for click
    colorOption.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent propagation to avoid immediate closure
      // Update the selected color for this level
      selectedLevelColors[level] = color;
      // Update the default color display
      parentElement.style.backgroundColor = color;
      // Re-render the mind map
      renderMindMap();
      // Close the popup
      colorPopup.style.display = 'none';
    });

    colorPopup.appendChild(colorOption);
  });

  // Position the popup relative to the parent
  const rect = parentElement.getBoundingClientRect();
  colorPopup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  colorPopup.style.left = `${rect.left + window.scrollX}px`;
  colorPopup.style.display = 'flex';
}

// Close the popup when the user clicks outside
document.addEventListener('click', () => {
  const colorPopup = document.getElementById('color-popup');
  colorPopup.style.display = 'none';
});

// Function to assign colors to nodes
function assignColors(node, levelColors) {
  const nodeColor = levelColors[node.level] || '#bfb5fe';
  node['background-color'] = nodeColor;

  if (node.children) {
    node.children.forEach(child => assignColors(child, levelColors));
  }
}

// Function to display the mind map with jsMind
function renderMindMap() {
  const markdown = document.getElementById('markdown-input').value;
  // Reset maximum level
  maxLevel = 0;
  const data = parseMarkdownToJsMind(markdown);

  // Generate color pickers for levels
  generateLevelColorPickers(maxLevel);

  // Get user selected colors
  const levelColors = getUserSelectedColors(maxLevel);

  // Assign colors to nodes
  assignColors(data, levelColors);

  const mind = {
    meta: {
      name: 'jsMind Example',
      author: 'Assistant',
      version: '1.0',
    },
    format: 'node_tree',
    data: data,
  };

  initializeMindMap(mind);

  // Save Markdown and the mind map
  saveToLocalStorage();
}

// Function to initialize the mind map
function initializeMindMap(mindData) {
  const options = {
    container: 'jsmind_container',
    editable: true,
    theme: 'greensea',
    view: {
      hmargin: 50,
      vmargin: 50,
      line_width: 2,
      line_color: '#555',
      draggable: true,
      zoom: {
        enable: true,
        minScale: 0.5,
        maxScale: 2,
      },
    },
    direction: currentDirection // Use current direction
  };

  document.getElementById('jsmind_container').innerHTML = '';

  jm = new jsMind(options);
  jm.show(mindData);

  // Save initial state to undoStack if empty
  if (undoStack.length === 0) {
    const mindDataClone = JSON.parse(JSON.stringify(mindData));
    undoStack.push(mindDataClone);
  }

  // Save the mind map
  saveMindMapToLocalStorage();

  // Event listeners for node interactions
  jm.add_event_listener(function (eventType, data) {
    const colorPicker = document.getElementById('color-picker');
    const addImageButton = document.getElementById('add-image-button');

    if (eventType === jsMind.event_type.select) {
      // Show the color picker
      colorPicker.style.display = 'block';
      colorPicker.value = data.node.data['background-color'] || '#ffffff';

      // Show the add image button
      addImageButton.style.display = 'block';
    } else if (eventType === jsMind.event_type.deselect) {
      // Hide the color picker
      colorPicker.style.display = 'none';

      // Hide the add image button
      addImageButton.style.display = 'none';
    }

    // Save state after modifications
    if (eventType === jsMind.event_type.edit || eventType === jsMind.event_type.resize) {
      saveState();
      saveMindMapToLocalStorage();
    }
  });
}

// Function to save current state for Undo
function saveState() {
  if (jm) {
    const mindData = jm.get_data('node_tree');
    // Clone to avoid references
    const mindDataClone = JSON.parse(JSON.stringify(mindData));
    undoStack.push(mindDataClone);
    // Limit the undo stack to 50 states to avoid overload
    if (undoStack.length > 50) {
      const removedState = undoStack.shift();
    }
  }
}

// Function to Undo
function undo() {
  if (undoStack.length > 1) {
    // Save current state by removing the last state
    const currentState = undoStack.pop();
    // Revert to the previous state
    const previousState = undoStack[undoStack.length - 1];
    jm.show(previousState);
  } else {
    alert('Nothing to undo.');
  }
}

// Keyboard shortcuts for Undo
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault();
    undo();
  }
});


function toggleOrientation() {
  // Toggle between 'bottom' (vertical) and 'right' (horizontal)
  currentDirection = (currentDirection === 'bottom') ? 'right' : 'bottom';
  renderMindMap(); // Re-render the mind map with the new orientation
}
// Function to save the Markdown and mind map to local storage
function saveToLocalStorage() {
  // Save the Markdown
  const markdown = document.getElementById('markdown-input').value;
  localStorage.setItem('markdownInput', markdown);

  // Save the mind map if it exists
  if (jm) {
    const mindData = jm.get_data('node_tree');
    localStorage.setItem('mindData', JSON.stringify(mindData));
  }
}

// Function to load the Markdown and mind map from local storage
function loadFromLocalStorage() {
  const markdown = localStorage.getItem('markdownInput');
  const mindDataString = localStorage.getItem('mindData');

  if (markdown !== null) {
    document.getElementById('markdown-input').value = markdown;
  }

  if (mindDataString) {
    const mindData = JSON.parse(mindDataString);
    initializeMindMap(mindData);
    return true;
  } else if (markdown !== null) {
    renderMindMap();
    return true;
  }
  return false;
}

// Save the mind map after each significant action
function saveMindMapToLocalStorage() {
  if (jm) {
    const mindData = jm.get_data('node_tree');
    localStorage.setItem('mindData', JSON.stringify(mindData));
  }
}

// Add event listener to save Markdown on each modification
document.getElementById('markdown-input').addEventListener('input', function() {
  saveToLocalStorage();
});

// Functions to zoom
function zoomIn() {
  jm.view.zoomIn();
}

function zoomOut() {
  jm.view.zoomOut();
}

// Functions to expand and collapse nodes
function expandAll() {
  jm.expand_all();
}

function collapseAll() {
  jm.collapse_all();
}

// Function to export the mind map as image
function exportMindMap() {
  jm.screenshot.shootDownload();
}

// Function to trigger the mind map import
function triggerFileInput() {
  document.getElementById('file-input').click();
}

// Function to load a mind map from a file
function loadMindMap(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const mindData = JSON.parse(e.target.result);
        initializeMindMap(mindData);
      } catch (error) {
        alert('Error loading the mind map: ' + error.message);
      }
    };
    reader.readAsText(file);
  }
}

/* ====================================================
    5. Focus Mode and Controls Management
==================================================== */

// Function to toggle focus mode
function toggleFocusMode() {
  const body = document.body;
  body.classList.toggle('focus-mode');
  const isFocusMode = body.classList.contains('focus-mode');

  // Change the icon of the toolbar button
  const focusButton = document.querySelector('.mindmap-toolbar .toggle-focus');
  if (!focusButton) {
    return;
  }

  const focusButtonIcon = focusButton.querySelector('i');
  if (!focusButtonIcon) {
    return;
  }

  if (isFocusMode) {
    focusButtonIcon.classList.remove('fa-expand');
    focusButtonIcon.classList.add('fa-compress');
    toggleControls();

    // Show the exit focus button
    const exitFocusButton = document.getElementById('exit-focus-button');
    if (exitFocusButton) {
      exitFocusButton.style.display = 'block';
    }
  } else {
    focusButtonIcon.classList.remove('fa-compress');
    focusButtonIcon.classList.add('fa-expand');

    // Hide the exit focus button
    const exitFocusButton = document.getElementById('exit-focus-button');
    if (exitFocusButton) {
      exitFocusButton.style.display = 'none';
    }
  }
}

// Listen for Escape key to exit focus mode
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && document.body.classList.contains('focus-mode')) {
    toggleFocusMode();
  }
});

// Event for the exit focus button and toggle-controls
document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.querySelector('.toggle-controls');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleControls);
  }

  // Listener for the exit-focus-button
  const exitFocusButton = document.getElementById('exit-focus-button');
  if (exitFocusButton) {
    exitFocusButton.addEventListener('click', toggleFocusMode);
  }

  // Auto-resize the textarea
  const textarea = document.getElementById('markdown-input');

  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  autoResizeTextarea(textarea);

  textarea.addEventListener('input', function() {
    autoResizeTextarea(textarea);
  });

  // Load the mind map from local storage on page load
  const loaded = loadFromLocalStorage();
  if (!loaded) {
    renderMindMap(); // Load the default mind map if nothing is stored
  }

  // Check if the popup should be opened automatically
  const hidePopup = localStorage.getItem('hideInstructionsPopup');
  if (!hidePopup) {
    openInstructionsPopup();
  }
});

// Resize the mind map on window resize
window.addEventListener('resize', function() {
  if (jm) {
    jm.resize();
  }
});

// Function to toggle the display of controls with icons
function toggleControls() {
  const controls = document.querySelector('.controls');
  const toggleButton = document.querySelector('.toggle-controls');
  const toggleButtonIcon = toggleButton.querySelector('i');

  controls.classList.toggle('collapsed');

  // Update the toggle button icon
  if (controls.classList.contains('collapsed')) {
    // Change icon to represent "Show Controls"
    toggleButtonIcon.classList.remove('fa-eye-slash');
    toggleButtonIcon.classList.add('fa-eye');
  } else {
    // Change icon to represent "Hide Controls"
    toggleButtonIcon.classList.remove('fa-eye');
    toggleButtonIcon.classList.add('fa-eye-slash');
  }

  // Adjust the mind map size
  if (jm) {
    jm.resize();
  }
}

/* ====================================================
    6. Instructions Popup
==================================================== */

// Function to open the instructions popup
function openInstructionsPopup(clicked = false) {
  const hidePopup = localStorage.getItem('hideInstructionsPopup');
  if (!clicked && clickedhidePopup === 'true') {
    return; // Do not open the popup if the user has chosen not to display it anymore
  }
  const popup = document.getElementById('instructions-popup');
  popup.style.display = 'flex';
}

// Function to close the instructions popup
function closeInstructionsPopup() {
  const popup = document.getElementById('instructions-popup');
  popup.style.display = 'none';
}

// Function to handle "Do not show again" preference
function dontShowAgain() {
  const checkbox = document.getElementById('dont-show-again');
  if (checkbox.checked) {
    localStorage.setItem('hideInstructionsPopup', 'true');
  } else {
    localStorage.removeItem('hideInstructionsPopup');
  }
}
