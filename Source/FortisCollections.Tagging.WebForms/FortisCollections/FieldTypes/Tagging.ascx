<%@ Control Language="C#" AutoEventWireup="true" Inherits="FortisCollections.Tagging.Controls.TaggingControl" %>
<div id="<%=ID%>_TagField">
	<input id="<%= ID %>_Value" type="hidden" class="tagHiddenInputBox" value="<%= Value %>">
	<div>
		<p>Search</p>
		<div class="inputWrap">
			<input id="<%= ID %>_TagEntry" class="tagInputBox" />
			<div class="addTagButton">Add</div>
			<div class="messageTextBox"></div>
			<div class="tagSuggestionBox_wrap">
				<span class="closebtn"></span>
				<div class="tagSuggestionBox"></div>
			</div>
		</div>
	</div>
	<hr />
	<div class="selectedTags">
		<p>Selected</p>
		<div id="<%= ID %>_Selected" class="tagsAdded">
				<% foreach (var selectedValue in SelectedValues) { %>
				<span data-id="<%= selectedValue.Key %>" class="addedTagItem"><span class="displayText"><%= selectedValue.Value %></span><a href="#" class="addedTagItemCloseBtn"></a></span>
			<% } %>
		</div>
	</div>
	<link rel="stylesheet" type="text/css" href="/FortisCollections/FieldTypes/assets/Tagging/css/field.css"/>
	<script>window.jQuery || document.write('<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"><\/script>')</script>
	<script type="text/javascript">
		var $taggingField = jQuery.noConflict();

		$taggingField(document).ready(function () {
			var taggingFunctionality<%=ID%> = new TagField("#<%=ID%>_TagField", ".tagHiddenInputBox", ".tagsAdded", ".addTagButton", ".tagInputBox", ".tagSuggestionBox", "<%= Filter %>", ".messageTextBox");
		});
	</script>
</div>