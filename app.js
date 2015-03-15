var margin = {top: 50, right: 20, bottom: 50, left: 20};
var width = 500;//window.innerWidth - margin.left - margin.right - 50;
var height = 500;//window.innerHeight - margin.top - margin.bottom - 50;
var urgencyMax = 14;
var importanceMax = 4;
var widthScale = d3.scale.linear()
					.domain([0, urgencyMax])
					.range([0, width]);
var heightScale = d3.scale.linear()
					.domain([1, importanceMax])
					.range([0, height]);

var canvas = d3.select('#eisenhower')
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + ","+ margin.top +")");
function init_matrix() {
	var xaxis = d3.svg.axis()
				.ticks(0)
				.scale(widthScale);

	var yaxis = d3.svg.axis()
				.ticks(0)
				.scale(heightScale);
	//place axes
	canvas.append("g")
		.attr("transform", "translate(0,"+ height/2 +")")
		.call(xaxis);

	canvas.append("g")
		.attr("transform", "rotate(90) translate(0, "+ -width/2 +")")
		.call(yaxis);
};
init_matrix();

var importanceFn = function(task) {
	priority = isNaN(task.task.priority) ? importanceMax : task.task.priority;
	//console.log('priority:', priority);
	return priority;
};
var urgencyFn = function(task) {
	dueDate = task.task.due
	daysLeft = 50;
	if (dueDate) {
		now = new Date();
		daysLeft = daysBetween(now, new Date(dueDate));
	}
	normDaysLeft = daysLeft < 0 ? 0 : daysLeft;
	return normDaysLeft;
};
var descFn = function(task) {
	return task.name
};

var idFn = function(task) {
    return task.id;
};

var numSelected = 0;
var selectedClasses = ["red", "green", "blue", "yellow"];

var refreshGraph = function(tasks) {
	canvas.selectAll("g.gtask").remove();
	var gtasks = canvas.selectAll("g.gtask")
		.data(tasks)
		.enter()
		.append('g')
		.classed('gtask', true);
	//Add one circle to group
	gtasks.append("circle")
		.attr('class', 'task')
		.attr("r", 4)
		.attr("cx", function(task) {
			return widthScale(urgencyFn(task));
		})
		.attr("cy", function(task) {
			return heightScale(importanceFn(task));
		})
        .attr("data-rtm-id", function(task) {
			return idFn(task);
		})
		.on("mouseover", function(task) {
			d3.select(this).classed("task-hover", true);
		})
		.on("mouseout", function(task) {
			d3.select(this).classed("task-hover", false);
		})
        .on("click", function(task) {
            if (this.classList.contains("task-selected")) {
                taskdiv = $("div#tasks .task-div[data-rtm-id="+this.attributes["data-rtm-id"].value+"]")
				taskdiv.removeClass("task-list-selected");
				taskdiv.removeClass(selectedClasses.join(" "));
				taskdiv.parent().append($(".task-div").not($(".task-list-selected")));
                this.classList.remove("task-selected");
            } else {
                taskdiv = $("div#tasks .task-div[data-rtm-id="+this.attributes["data-rtm-id"].value+"]");
                taskdiv.addClass("task-list-selected");
				taskdiv.addClass(selectedClasses[numSelected++ % selectedClasses.length]);
                taskdiv.parent().append($(".task-div").not($(".task-list-selected")));
                this.classList.add("task-selected");
            }
		})
//	var labels = gtasks.append("text")
//		.attr("text-anchor", "right")
//		.attr('width', "100px")
//		.attr("transform", function(task) {
//			return "translate("
//					+ (parseFloat(widthScale(urgencyFn(task))) + 10)
//					+ "," + heightScale(importanceFn(task))
//					+ ")";
//		})
//		.text(function(task) { return descFn(task); });
}

var $initial_task_divs = null;

function loadAndGraphTasks() {
	$('#tasks').html('Loading...');
	var listId = $(this).data('id');
	rtm.get('rtm.tasks.getList', {list_id: listId, filter: 'status:incomplete'}, function(resp){
		$('#tasks').empty();
		tasks = [];
		if (!resp.rsp.tasks || !resp.rsp.tasks.list) {
			$('#tasks').html('No tasks!');
			return;
		}
		$.each(resp.rsp.tasks.list, function(index, listItem){
			if (Object.prototype.toString.call(listItem.taskseries) != '[object Array]') {
				listItem.taskseries = [listItem.taskseries];
			}
			$.each(listItem.taskseries, function(index, task){
				tasks.push(task);
				var div = $('<div>')
                           .addClass('task-div')
                           .attr("data-rtm-id", task.id);
				$('<input>').attr('type', 'checkbox').appendTo(div);
				$('<span>').html(task.name).appendTo(div);
				div.appendTo($('#tasks'));
			})
            $initial_task_divs = $('.task-div');
		});
		refreshGraph(tasks);
	})
}

var loadLists = function(){
	$('#auth').hide();
	rtm.get('rtm.lists.getList', function(resp){
		$.each(resp.rsp.lists.list, function(index, list){
			$('<button>').html(list.name).data({
				id: list.id
			}).addClass('list')
			.appendTo($('#lists'));
		});
		$('button.list').click(loadAndGraphTasks)
	});
}
