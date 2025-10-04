import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { bookService } from '../../services/bookService';
import { studentService } from '../../services/studentService';
import { Book, Student } from '../../lib/supabase';

interface GraphNode {
  id: string;
  label: string;
  type: 'book' | 'author' | 'category' | 'student';
  metadata?: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export const GraphView = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      const [books, students] = await Promise.all([
        bookService.getAllBooks(),
        studentService.getAllStudents(),
      ]);

      createGraph(books, students);
    } catch (err) {
      setError('Failed to load graph data');
    } finally {
      setLoading(false);
    }
  };

  const createGraph = (books: Book[], students: Student[]) => {
    if (!svgRef.current) return;

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const authorSet = new Set<string>();
    const categorySet = new Set<string>();

    books.forEach((book) => {
      const bookId = `book-${book.id}`;
      nodes.push({
        id: bookId,
        label: book.title,
        type: 'book',
        metadata: book,
      });

      const authorId = `author-${book.author}`;
      if (!authorSet.has(book.author)) {
        authorSet.add(book.author);
        nodes.push({
          id: authorId,
          label: book.author,
          type: 'author',
        });
      }
      links.push({
        source: bookId,
        target: authorId,
        type: 'written-by',
      });

      const categoryId = `category-${book.category}`;
      if (!categorySet.has(book.category)) {
        categorySet.add(book.category);
        nodes.push({
          id: categoryId,
          label: book.category,
          type: 'category',
        });
      }
      links.push({
        source: bookId,
        target: categoryId,
        type: 'belongs-to',
      });
    });

    students.forEach((student) => {
      if (student.currently_borrowing === 'YES' && student.borrowed_book_id) {
        const studentId = `student-${student.id}`;
        nodes.push({
          id: studentId,
          label: student.name,
          type: 'student',
          metadata: student,
        });

        links.push({
          source: studentId,
          target: `book-${student.borrowed_book_id}`,
          type: 'borrowed',
        });
      }
    });

    renderGraph(nodes, links);
  };

  const renderGraph = (nodes: GraphNode[], links: GraphLink[]) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 600;

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    const nodeTypeColors = {
      book: '#0f172a',
      author: '#059669',
      category: '#dc2626',
      student: '#2563eb',
    };

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', (d) => d.type === 'book' ? 12 : 10)
      .attr('fill', (d) => nodeTypeColors[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    node.append('text')
      .text((d) => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
      .attr('x', 15)
      .attr('y', 4)
      .attr('font-size', '11px')
      .attr('fill', '#475569')
      .style('pointer-events', 'none');

    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '8px 12px')
      .style('border', '1px solid #cbd5e1')
      .style('border-radius', '6px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
      .style('z-index', '1000');

    node
      .on('mouseover', function(event, d: any) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', (d: any) => d.type === 'book' ? 16 : 14);

        let tooltipContent = `<strong>${d.label}</strong><br/>Type: ${d.type}`;
        if (d.metadata) {
          if (d.type === 'book') {
            tooltipContent += `<br/>Author: ${d.metadata.author}<br/>Available: ${bookService.getAvailableCopies(d.metadata)}`;
          } else if (d.type === 'student') {
            tooltipContent += `<br/>Days borrowed: ${d.metadata.days_borrowed}`;
          }
        }

        tooltip
          .html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .transition()
          .duration(200)
          .style('opacity', 1);

        const connectedNodes = new Set<string>();
        links.forEach((l) => {
          if (l.source === d.id || (l.source as any).id === d.id) {
            connectedNodes.add(typeof l.target === 'string' ? l.target : (l.target as any).id);
          }
          if (l.target === d.id || (l.target as any).id === d.id) {
            connectedNodes.add(typeof l.source === 'string' ? l.source : (l.source as any).id);
          }
        });

        node.style('opacity', (n: any) =>
          n.id === d.id || connectedNodes.has(n.id) ? 1 : 0.3
        );

        link.style('opacity', (l: any) => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return sourceId === d.id || targetId === d.id ? 1 : 0.1;
        });
      })
      .on('mouseout', function() {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', (d: any) => d.type === 'book' ? 12 : 10);

        tooltip.transition().duration(200).style('opacity', 0);

        node.style('opacity', 1);
        link.style('opacity', 0.6);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading graph...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Relationship Graph</h2>
        <p className="text-slate-600 mt-1">Interactive visualization of books, authors, categories, and borrowers</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-slate-900"></div>
            <span className="text-slate-700">Books</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-emerald-600"></div>
            <span className="text-slate-700">Authors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            <span className="text-slate-700">Categories</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
            <span className="text-slate-700">Students</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Hover over nodes to highlight connections. Drag nodes to reposition. Scroll to zoom.
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full"
          style={{ height: '600px' }}
        ></svg>
      </div>
    </div>
  );
};
