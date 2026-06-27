import json
from plotly import graph_objects as go
from plotly.utils import PlotlyJSONEncoder

def generate_grid_graph(bus_system: str, ratio=0.75, **kwargs):
    """
    Interface function called by main.py to stream custom IEEE grid coordinates dynamically.
    Accepts **kwargs to transparently handle session_name and timestamp parameters from front-end channels.
    """
    unused_lines = ['33', '34', '35', '36', '37', '22']
    v = [k for k in range(1, 34)]
    p_load = [k for k in range(1, 34)]
    q_load = [k for k in range(1, 34)]
    r = [k for k in range(1, 38)]
    x = [k for k in range(1, 38)]
    
    return topology(ratio, unused_lines, v, p_load, q_load, r, x)

def main(ratio=0.75):
    return generate_grid_graph('33', ratio)

def topology(ratio=0.75, unused_lines=None, v=None, p_load=None, q_load=None, r=None, x=None):
    if unused_lines is None:
        unused_lines = []
    if v is None:
        v = [0] * 33
    if p_load is None:
        p_load = [0] * 33
    if q_load is None:
        q_load = [0] * 33
    if r is None:
        r = [0] * 37
    if x is None:
        x = [0] * 37

    # 1. Define Bus Coordinates {Bus_ID: (x, y)}
    bus_coords = {
        'Sub': (0, 10), 1: (0, 9), 2: (0, 8), 3: (0, 7), 4: (0, 6), 5: (0, 5),
        6: (0, 4), 7: (0, 3), 8: (0, 2), 9: (0, 1), 10: (0, 0), 11: (0, -1),
        12: (0, -2), 13: (0, -3), 14: (0, -4), 15: (0, -5), 16: (0, -6),
        17: (0, -7), 18: (0, -8), 19: (-1, 4), 20: (-1, 3), 21: (-1, 2),
        22: (-1, 1), 23: (1, 5), 24: (1, 4), 25: (1, 3), 26: (0.6, 2),
        27: (0.6, 1), 28: (0.6, 0), 29: (0.6, -1), 30: (0.6, -2), 31: (0.6, -3),
        32: (0.6, -4), 33: (0.6, -5),
        # Tie-Line Router Nodes
        2191: (-0.04, 8), 2192: (-0.04, 7.6), 2193: (-1, 7.6),
        3231: (0.04, 7), 3232: (0.04, 6.6), 3233: (1, 6.6),
        6261: (0.04, 4), 6262: (0.04, 3.6), 6263: (0.6, 3.6),
        8211: (-0.04, 2), 8212: (-0.04, 1.6), 8213: (-0.96, 1.6), 8214: (-0.96, 2),
        9151: (0.04, 1), 9152: (0.04, 0.6), 9153: (0.34, 0.6), 9154: (0.34, -5.4), 9155: (0.04, -5.4), 9156: (0.04, -5),
        12221: (-0.04, -2), 12222: (-0.04, -2.4), 12223: (-1, -2.4),
        18331: (0, -8.4), 18332: (0.6, -8.4),
        25291: (1, -1.4), 25292: (0.64, -1.4), 25293: (0.64, -1),
    }

    # 2. Define Lines
    lines = [
        ('Sub', 1, 's'), (1, 2, 's'), (2, 3, 's'), (3, 4, 's'), (4, 5, 's'),
        (5, 6, 's'), (6, 7, 's'), (7, 8, 's'), (8, 9, 's'), (9, 10, 's'),
        (10, 11, 's'), (11, 12, 's'), (12, 13, 's'), (13, 14, 's'), (14, 15, 's'),
        (15, 16, 's'), (16, 17, 's'), (17, 18, 's'), (19, 20, 's'), (20, 21, 's'),
        (21, 22, 's'), (23, 24, 's'), (24, 25, 's'), (26, 27, 's'), (27, 28, 's'),
        (28, 29, 's'), (29, 30, 's'), (30, 31, 's'), (31, 32, 's'), (32, 33, 's'),
        (2191, 2192, 's'), (2192, 2193, 's'), (2193, 19, 's'),
        (3231, 3232, 's'), (3232, 3233, 's'), (3233, 23, 's'),
        (6261, 6262, 's'), (6262, 6263, 's'), (6263, 26, 's'),
        (8211, 8212, 't'), (8212, 8213, 't'), (8213, 8214, 't'),
        (9151, 9152, 't'), (9152, 9153, 't'), (9153, 9154, 't'), (9154, 9155, 't'), (9155, 9156, 't'),
        (12221, 12222, 't'), (12222, 12223, 't'), (12223, 22, 't'),
        (18, 18331, 't'), (18331, 18332, 't'), (18332, 33, 't'),
        (25, 25291, 't'), (25291, 25292, 't'), (25292, 25293, 't'),
    ]

    line_labels = {
        (1, 2): '1', (2, 3): '2', (3, 4): '3', (4, 5): '4', (5, 6): '5',
        (6, 7): '6', (7, 8): '7', (8, 9): '8', (9, 10): '9', (10, 11): '10',
        (11, 12): '11', (12, 13): '12', (13, 14): '13', (14, 15): '14', (15, 16): '15',
        (16, 17): '16', (17, 18): '17', (19, 20): '19', (20, 21): '20', (21, 22): '21',
        (23, 24): '23', (24, 25): '24', (26, 27): '26', (27, 28): '27', (28, 29): '28',
        (29, 30): '29', (30, 31): '30', (31, 32): '31', (32, 33): '32',
        (2192, 2193): '18', (3232, 3233): '22', (6262, 6263): '25', (8212, 8213): '33',
        (9153, 9154): '34', (12222, 12223): '35', (18331, 18332): '36', (25, 25291): '37'
    }

    undisplayed_labels = {
        (2191, 2192): '18', (2193, 19): '18', (6261, 6262): '25', (6263, 26): '25',
        (3231, 3232): '22', (3233, 23): '22', (8211, 8212): '33', (8213, 8214): '33',
        (9151, 9152): '34', (9152, 9153): '34', (9154, 9155): '34', (9155, 9156): '34',
        (12221, 12222): '35', (12223, 22): '35', (18, 18331): '36', (18332, 33): '36',
        (25291, 25292): '37', (25292, 25293): '37',
    }

    fig = go.Figure()
    assigned_line_colors = {}

    # 3. Add Lines to Figure
    for start_node, end_node, l_type in lines:
        if start_node in bus_coords and end_node in bus_coords:
            x0, y0 = bus_coords[start_node]
            x1, y1 = bus_coords[end_node]
            current_line_num = (
                line_labels.get((start_node, end_node)) or 
                line_labels.get((end_node, start_node)) or 
                undisplayed_labels.get((start_node, end_node)) or 
                undisplayed_labels.get((end_node, start_node))
            )
            if current_line_num in unused_lines:
                color = 'lightgrey'
            else:
                color = 'red' if l_type == 't' else 'black'
                
            if current_line_num:
                assigned_line_colors[current_line_num] = color
                
            dash = '4, 4' if l_type == 't' else 'solid'
            width = 1 if l_type == 't' else 2
            
            fig.add_trace(go.Scatter(
                x=[x0, x1], y=[y0, y1], mode='lines',
                line=dict(color=color, width=width * ratio, dash=dash),
                hoverinfo='none', showlegend=False
            ))

    # 3b. Add Line Number Labels
    for (start_node, end_node), label in line_labels.items():
        if start_node in bus_coords and end_node in bus_coords:
            x0, y0 = bus_coords[start_node]
            x1, y1 = bus_coords[end_node]
            if x0 == x1:
                mid_x = x0 + 0.12
                mid_y = (y0 + y1) / 2 - 0.1
            else:
                mid_y = y0 + 0.3
                mid_x = (x0 + x1) / 2
                
            actual_line_color = assigned_line_colors.get(label, 'black')
            text_color = 'blue' if actual_line_color == 'black' else actual_line_color
            hover_color = {"red": "white", "blue": "white", "lightgrey": "black"}
            
            fig.add_trace(go.Scatter(
                x=[mid_x], y=[mid_y], mode='text', text=[label],
                textposition="middle center",
                textfont=dict(size=12 * ratio, color=text_color, family="Courier New", weight="bold"),
                hoverinfo='text',
                hovertext=[f"Line {label}<br>Resistance: {r[int(label)-1]}<br>Reactance: {x[int(label)-1]}"],
                hoverlabel=dict(
                    bgcolor=text_color,
                    font=dict(family="Courier New", color=hover_color[text_color], weight="bold")
                ),
                showlegend=False
            ))

    # 4. Add Buses
    real_buses = [k for k in bus_coords.keys() if k != 'Sub' and k < 100]
    bus_x = [bus_coords[k][0] for k in real_buses]
    bus_y = [bus_coords[k][1] for k in real_buses]
    bus_text = [str(k) for k in real_buses]

    fig.add_trace(go.Scatter(
        x=bus_x, y=bus_y, mode='markers',
        marker=dict(symbol='line-ew', size=30 * ratio, line=dict(width=4 * ratio, color='black')),
        hoverinfo='none', showlegend=False
    ))

    text_x_shifted = [x_val + 0.13 for x_val in bus_x]
    fig.add_trace(go.Scatter(
        x=text_x_shifted, y=bus_y, mode='markers+text', text=bus_text,
        textposition="middle center",
        textfont=dict(size=15 * ratio, color='black', family="Courier New", weight="bold"),
        marker=dict(symbol='circle', size=25 * ratio, color='white', line=dict(width=1.5 * ratio, color='black')),
        hoverinfo='text',
        hovertext=[f"Bus: {k}<br>Voltage: {v[k-1]}<br>Active Load: {p_load[k-1]}<br>Reactive Load: {q_load[k-1]}" for k in real_buses],
        hoverlabel=dict(font=dict(family="Courier New", weight="bold")),
        showlegend=False
    ))

    # 5. Add Substation
    fig.add_trace(go.Scatter(
        x=[bus_coords['Sub'][0]], y=[10.5], mode='text', text="Substation",
        textposition="top center",
        textfont=dict(size=18 * ratio, color='black', family="Merriweather Sans"),
        hoverinfo='none', showlegend=False
    ))

    # 6. Structural Static Substation Box Label
    layout_shapes = [
        dict(type="rect", x0=-0.1, x1=0.1, y0=9.8, y1=10.2,
             line=dict(color="black", width=4 * ratio), fillcolor="white", xref="x", yref="y")
    ]
    fig.update_layout(shapes=layout_shapes)

    # Arrow configuration constants
    arrow_offset = 0.06
    arrow_length = 0.32
    arrow_definitions = [
        # Main Spine Right Side Flips
        (0.0 + arrow_offset, 7.6), (0.0 + arrow_offset, 1.6), (0.0 + arrow_offset, -2.4),
        # Main Spine Standard Left Side Drops
        (0.0 - arrow_offset, 6.6), (0.0 - arrow_offset, 5.6), (0.0 - arrow_offset, 4.6),
        (0.0 - arrow_offset, 3.6), (0.0 - arrow_offset, 2.6), (0.0 - arrow_offset, 0.6),
        (0.0 - arrow_offset, -0.4), (0.0 - arrow_offset, -1.4), (0.0 - arrow_offset, -3.4),
        (0.0 - arrow_offset, -4.4), (0.0 - arrow_offset, -5.4), (0.0 - arrow_offset, -6.4),
        (0.0 - arrow_offset, -7.4), (0.0 - arrow_offset, -8.4),
        # Left Branch Left Side Drops (x = -1.0)
        (-1.0 - arrow_offset, 3.6), (-1.0 - arrow_offset, 2.6), (-1.0 - arrow_offset, 1.6), (-1.0 - arrow_offset, 0.6),
        # Outer Right Branch Right Side Drops (x = 1.0)
        (1.0 + arrow_offset, 4.6), (1.0 + arrow_offset, 3.6), (1.0 + arrow_offset, 2.6),
        # Inner Right Branch Right Side Drops (x = 0.6)
        (0.6 + arrow_offset, 1.6), (0.6 + arrow_offset, 0.6), (0.6 + arrow_offset, -0.4),
        (0.6 + arrow_offset, -1.4), (0.6 + arrow_offset, -2.4), (0.6 + arrow_offset, -3.4),
        (0.6 + arrow_offset, -4.4), (0.6 + arrow_offset, -5.4)
    ]

    for ax, ay in arrow_definitions:
        # Draw the Arrow Body Stem
        fig.add_trace(go.Scatter(
            x=[ax, ax], y=[ay + arrow_length, ay + 0.05], mode='lines',
            line=dict(color='black', width=2 * ratio), hoverinfo='none', showlegend=False
        ))
        # Draw the Arrow Head at the base tip
        fig.add_trace(go.Scatter(
            x=[ax], y=[ay], mode='markers',
            marker=dict(symbol='triangle-down', size=12 * ratio, color='black'),
            hoverinfo='none', showlegend=False
        ))

    # --- COMPATIBLE RESPONSIVE DESIGNS ---
    fig.update_layout(
        showlegend=False,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        xaxis=dict(showgrid=False, zeroline=False, visible=False, fixedrange=False, range=[-2.0, 2.0]),
        yaxis=dict(showgrid=False, zeroline=False, visible=False, fixedrange=False, range=[-10, 12]),
        autosize=True,
        margin=dict(l=0, r=0, t=10, b=0)
    )

    return json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))

if __name__ == "__main__":
    main(0.75)