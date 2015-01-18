using Sitecore.Globalization;
using System.Collections.Generic;
using System.IO;
using System.Web.UI;

namespace FortisCollections.Tagging.Controls
{
	public class TaggingControl : UserControl
	{
		private string _html;

		public string ControlAttributes { get; set; }
		public string Value { get; set; }
		public string Filter { get; set; }
		public string Database { get; set; }
		public Dictionary<string, string> SelectedValues = new Dictionary<string, string>();

		public string Render(bool reRender = false)
		{
			if (reRender || string.IsNullOrEmpty(_html))
			{
				Render(null);
			}

			return _html;
		}

		protected override void Render(HtmlTextWriter writer)
		{
			var sw = new StringWriter();
			var htw = new HtmlTextWriter(sw);

			base.Render(htw);

			_html = sw.ToString();
		}

		// TODO: Refactor away dependency
		protected string TranslateText(string text)
		{
			return Translate.Text(text);
		}
	}
}
