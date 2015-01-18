using FortisCollections.Tagging.Controls;
using Sitecore;
using Sitecore.Buckets.Extensions;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Security;
using Sitecore.ContentSearch.Utilities;
using Sitecore.Data.Items;
using Sitecore.Data.Query;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.Shell.Applications.ContentEditor;
using Sitecore.Text;
using Sitecore.Web;
using Sitecore.Web.UI.HtmlControls;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI.HtmlControls;
using IdHelper = Sitecore.Buckets.Util.IdHelper;

namespace FortisCollections.Tagging.FieldTypes
{
	public class Tagging : Control, IContentField
	{
		private string _source;
		private string _itemid;
		private string _filter = string.Empty;
		private int _pageNumber = 0;

		public string GetValue()
		{
			return this.Value;
		}

		public void SetValue(string value)
		{
			Value = value;
		}

		public string Source
		{
			get
			{
				return _source;
			}
			set
			{
				Assert.ArgumentNotNull(value, "value");
				_source = value;
			}
		}

		public string ItemID
		{
			get
			{
				return _itemid;
			}
			set
			{
				Assert.ArgumentNotNull(value, "value");
				_itemid = value;
			}
		}

		protected override void OnLoad(EventArgs e)
		{
			Assert.ArgumentNotNull(e, "e");
			base.OnLoad(e);

			var value = Sitecore.Context.ClientPage.ClientRequest.Form[this.ID + "_Value"];

			if (value != null)
			{
				if (base.GetViewStateString("Value", string.Empty) != value)
				{
					this.SetModified();
				}

				base.SetViewStateString("Value", value);
			}
		}

		protected void SetModified()
		{
			Sitecore.Context.ClientPage.Modified = true;
		}

		protected override void DoRender(System.Web.UI.HtmlTextWriter output)
		{
			var control = GetControl();

			Assert.ArgumentNotNull(output, "output");
			Assert.IsNotNull(control, "Invalid control selected for tagging field");

			control.ID = ID;
			control.ControlAttributes = GetControlAttributes();
			control.Value = StringUtil.EscapeQuote(Value);
			control.SelectedValues = GetSelectedValues();
			control.Filter = GenerateFilter();

			var head = WebUtil.FindControlOfType(Sitecore.Context.Page.Page, typeof(HtmlHead));

			if (head != null)
			{
				head.Controls.Add(new Control(){});
			}

			output.Write(control.Render());
		}

		private Dictionary<string, string> GetSelectedValues()
		{
			var processedSelectedValues = new Dictionary<string, string>();
			var selectedValues = new ListString(Value);

			foreach (var selectedValue in selectedValues)
			{
				var item = Sitecore.Context.ContentDatabase.GetItem(selectedValue);

				processedSelectedValues.Add(selectedValue, item == null ? selectedValue + " " + Translate.Text("[Item not found]") : item.DisplayName);
			}

			return processedSelectedValues;
		}

		private string GenerateFilter()
		{
			var filter = string.Empty;

			if (!string.IsNullOrEmpty(Source))
			{
				var sourceValues = StringUtil.GetNameValues(Source, '=', '&');
				var sourceFilter = sourceValues["Filter"];

				if (!string.IsNullOrEmpty(sourceFilter))
				{
					var sourceFilterValues = StringUtil.GetNameValues(sourceFilter, ':', '|');
					var locationFilter = MakeFilterQueryable(sourceValues["StartSearchLocation"]);
					var templateFilter = MakeTemplateFilterQueryable(sourceValues["TemplateFilter"]);
					var pageSize = string.IsNullOrEmpty(sourceValues["PageSize"]) ? 10 : int.Parse(sourceValues["PageSize"]);

					filter = string.Concat(new object[] { "&location=", IdHelper.NormalizeGuid(string.IsNullOrEmpty(locationFilter) ? Sitecore.Context.ContentDatabase.GetItem(ItemID).GetParentBucketItemOrRootOrSelf().ID.ToString() : locationFilter, true),
														   "&filterText=", sourceFilterValues["FullTextQuery"],
														   "&language=", sourceFilterValues["Language"],
														   "&pageSize=", pageSize,
														   "&sort=", sourceFilterValues["SortField"]
														 });

					if (sourceValues["TemplateFilter"] != null)
					{
						filter += "&template=" + templateFilter;
					}
				}
			}

			return string.Concat(filter + SearchHelper.GetDatabaseUrlParameter("&"));
		}

		private TaggingControl GetControl()
		{
			var control = new System.Web.UI.UserControl();

			return control.LoadControl("~/FortisCollections/FieldTypes/Tagging.ascx") as TaggingControl;
		}

		private string MakeFilterQueryable(string locationFilter)
		{
			if (!string.IsNullOrWhiteSpace(locationFilter) && locationFilter.StartsWith("query:"))
			{
				locationFilter = locationFilter.Replace("->", "=");

				var query = locationFilter.Substring(6);
				var flag = query.StartsWith("fast:");

				if (!flag)
				{
					QueryParser.Parse(query);
				}

				var item = flag ? Sitecore.Context.ContentDatabase.GetItem(ItemID).Database.SelectSingleItem(query) : Sitecore.Context.ContentDatabase.GetItem(ItemID).Axes.SelectSingleItem(query);

				locationFilter = item.ID.ToString();
			}

			return locationFilter;
		}

		private string MakeTemplateFilterQueryable(string templateFilter)
		{
			if (!string.IsNullOrWhiteSpace(templateFilter) && templateFilter.StartsWith("query:"))
			{
				templateFilter = templateFilter.Replace("->", "=");

				var str = templateFilter.Substring(6);
				var flag = str.StartsWith("fast:");

				if (!flag)
				{
					QueryParser.Parse(str);
				}

				var itemArray = flag ? Sitecore.Context.ContentDatabase.GetItem(ItemID).Database.SelectItems(str) : Sitecore.Context.ContentDatabase.GetItem(ItemID).Axes.SelectItems(str);

				templateFilter = string.Empty;
				templateFilter = itemArray.Aggregate<Item, string>(templateFilter, (current1, item) => current1 + item.ID.ToString());
			}

			return templateFilter;
		}
	}
}
