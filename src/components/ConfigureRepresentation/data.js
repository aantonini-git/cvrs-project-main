
export const data = [
    {
        id: 1,
        content: 'Visualization',
        checkboxes: [
          { id: '1', label: "Direct Visualization", bit: 0, checked:false, enabled:true },
        ],
        status: '0'
    },
    {
        id: 2,
        content: 'Axes Type',
        checkboxes: [
          { id: '2', label: "Unstructured", bit: 1, checked:false, enabled:true },
          { id: '2', label: "Quantitative", bit: 2, checked:false, enabled:true }
        ],
        status: '0'
    },
    {
        id: 3,
        content: 'Axes Orientation',
        checkboxes: [
          { id: '3', label: "Orthogonal", bit: 3, checked:false, enabled:true },
          { id: '3', label: "Parallel", bit: 4, checked:false, enabled:true },
          { id: '3', label: "Radial", bit: 5, checked:false, enabled:true },
          { id: '3', label: "Free", bit: 6, checked:false, enabled:true }
        ],
        status: '0'
    },
    {
        id: 4,
        content: 'Marks',
        checkboxes: [
          { id: '4', label: "Points", bit: 7, checked:false, enabled:true },
          { id: '4', label: "Lines", bit: 8, checked:false, enabled:true },
          { id: '4', label: "Areas", bit: 9, checked:false, enabled:true },
          { id: '4', label: "Glyphs", bit: 10, checked:false, enabled:true }
        ],
        status: '0'
    },
    {
        id: 5,
        content: 'Visual Channels',
        checkboxes: [
          { id: '5', label: "Position", bit: 11, checked:false, enabled:true },
          { id: '5', label: "Colour", bit: 12, checked:false, enabled:true },
          { id: '5', label: "Shape", bit: 13, checked:false, enabled:true },
          { id: '5', label: "Size", bit: 14, checked:false, enabled:true },
          { id: '5', label: "Orientation", bit: 15, checked:false, enabled:true }
        ],
        status: '0'
    },
    {
      id: 6,
      content: 'Tasks',
      checkboxes: [
        { id: '6', label: "Compare", bit: 16, checked:false, enabled:true },
        { id: '6', label: "Cluster", bit: 17, checked:false, enabled:true },
        { id: '6', label: "Distribution", bit: 18, checked:false, enabled:true },
        { id: '6', label: "Relationship", bit: 19, checked:false, enabled:true },
        { id: '6', label: "Sort", bit: 20, checked:false, enabled:true },
        { id: '6', label: "Explore", bit: 21, checked:false, enabled:true },
        { id: '6', label: "Part-to-Whole", bit: 22, checked:false, enabled:false }
      ],
      status: '0'
    }
]