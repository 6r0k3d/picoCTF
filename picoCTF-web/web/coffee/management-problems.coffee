Panel = ReactBootstrap.Panel
Button = ReactBootstrap.Button
Glyphicon = ReactBootstrap.Glyphicon
Col = ReactBootstrap.Col
Input = ReactBootstrap.Input

update = React.addons.update

ProblemFilter = React.createClass
  propTypes:
    onFilterChange: React.PropTypes.func.isRequired
    filter: React.PropTypes.string

  getInitialState: ->
    filter: @props.filter

  onChange: ->
    filterValue = this.refs.filter.getInputDOMNode().value
    @setState {filter: filterValue}
    @props.onFilterChange filterValue

  render: ->
    glyph = <Glyphicon glyph="search"/>
    <Input type='text' className="form-control"
      ref="filter"
      label="Search"
      addonBefore={glyph}
      onChange={@onChange}
      value={@state.filter}/>

Problem = React.createClass
  getInitialState: ->
    disabled: @props.disabled

  onStateToggle: (e) ->
    apiCall "POST", "/api/admin/problems/availability", {pid: @props.pid, state: !@state.disabled}
    .done ((api) ->
      if api.status == 1
        @setState update @state,
          disabled: $set: !@state.disabled
    ).bind this

  render: ->
    statusButton =
    <Button bsSize="xsmall" onClick={@onStateToggle}>
      {if @state.disabled then "Enable" else "Disable"}
    </Button>

    problemHeader =
    <div>
      {@props.name}
      <div className="pull-right">
        {statusButton}
      </div>
    </div>

    panelStyle = if @state.disabled then "default" else "info"

    <Panel bsStyle={panelStyle} header={problemHeader}>
      <p>meng</p>
    </Panel>

ProblemTab = React.createClass
  propTypes:
    problems: React.PropTypes.array.isRequired

  getInitialState: ->
    filterRegex: /.*/

  onFilterChange: (filter) ->
    try
      newFilter = new RegExp(filter)
      @setState update @state,
        filterRegex: $set: newFilter
    catch
      # We shouldn't do anything.

  render: ->
    problems = _.filter @props.problems, ((problem) ->
      @state.filterRegex.exec problem.name
    ).bind this

    problemComponents = problems.map (problem, i) ->
      <Col xs={6} lg={4} key={i}>
        <Problem {...problem}/>
      </Col>

    filterDisplay =
    <div className="row">
      <Col xs={3}>
        <h3>Challenges</h3>
      </Col>
      <Col xs={9} className="pad">
        <ProblemFilter filter="" onFilterChange={@onFilterChange}/>
      </Col>
    </div>

    <div>
      {filterDisplay}
      {problemComponents}
    </div>
